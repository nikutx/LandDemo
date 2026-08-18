/**
 * The same engine the UI uses, described as tools an AI agent can call.
 *
 * Everything here is transport-agnostic on purpose: the manifest is the JSON
 * Schema an MCP server would advertise via `tools/list`, and `callTool` is what
 * `tools/call` would dispatch to. Wrapping it in an MCP server (or an
 * Anthropic / OpenAI tool definition) is then a thin adapter rather than a
 * rewrite, because the domain logic never learned how it was being called.
 */
import { CONSTRAINT_DATASETS } from './datasets'
import { appraise } from './appraisal'
import { geocode, lookupSite, type LatLng } from './planningData'
import { scanNearby } from './scan'

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

const POINT_PROPERTIES = {
  latitude: { type: 'number', description: 'WGS84 latitude, Great Britain only' },
  longitude: { type: 'number', description: 'WGS84 longitude, Great Britain only' },
}

export const TOOL_MANIFEST: ToolDefinition[] = [
  {
    name: 'find_constraints',
    description:
      'Return every mapped planning designation that contains a point in Great Britain, ' +
      'such as Green Belt, National Landscape, flood risk zone or conservation area.',
    inputSchema: {
      type: 'object',
      properties: POINT_PROPERTIES,
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'appraise_site',
    description:
      'Score a site for planning difficulty and return a plain-English appraisal with ' +
      'the binding constraint, the deciding authority and concrete next steps.',
    inputSchema: {
      type: 'object',
      properties: POINT_PROPERTIES,
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'find_easier_nearby',
    description:
      'Sample the land around a point and return any of it that is less constrained, ' +
      'nearest and easiest first, with the distance and direction from the starting point.',
    inputSchema: {
      type: 'object',
      properties: {
        ...POINT_PROPERTIES,
        radius: {
          type: 'number',
          description: 'How far out to look, in metres. Defaults to 2000.',
        },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'locate_place',
    description:
      'Resolve a UK postcode or place name to coordinates so the other tools can be called.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'A UK postcode or place name, e.g. "GL7 5JB"' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_datasets',
    description:
      'List the designation datasets this server checks, with what each one means for development.',
    inputSchema: { type: 'object', properties: {} },
  },
]

type ToolArgs = Record<string, unknown>

function requirePoint(args: ToolArgs): LatLng {
  const lat = Number(args.latitude)
  const lng = Number(args.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('latitude and longitude are required numbers')
  }
  return { lat, lng }
}

/** Dispatch a tool call and return a JSON-serialisable result. */
export async function callTool(name: string, args: ToolArgs = {}): Promise<unknown> {
  switch (name) {
    case 'find_constraints': {
      const lookup = await lookupSite(requirePoint(args))
      return {
        count: lookup.constraints.length,
        constraints: lookup.constraints.map((c) => ({
          designation: c.dataset.label,
          dataset: c.dataset.id,
          name: c.name,
          reference: c.reference,
          meaning: c.dataset.hint,
        })),
      }
    }

    case 'appraise_site': {
      const lookup = await lookupSite(requirePoint(args))
      const appraisal = appraise(lookup)
      return {
        score: appraisal.score,
        verdict: appraisal.verdict,
        headline: appraisal.headline,
        summary: appraisal.summary,
        decidedBy: lookup.context.district,
        designations: appraisal.drivers.map((c) => c.dataset.label),
        nextSteps: appraisal.nextSteps,
        sources: ['planning.data.gov.uk', 'postcodes.io'],
      }
    }

    case 'find_easier_nearby': {
      const origin = requirePoint(args)
      const radius = Number(args.radius)
      const lookup = await lookupSite(origin)
      const here = appraise(lookup)

      const candidates = await scanNearby(origin, here.score, {
        radius: Number.isFinite(radius) && radius > 0 ? radius : 2000,
      })

      return {
        from: { score: here.score, verdict: here.verdict },
        found: candidates.length,
        candidates: candidates.map((candidate) => ({
          latitude: candidate.point.lat,
          longitude: candidate.point.lng,
          score: candidate.score,
          verdict: candidate.headline,
          designations: candidate.designations,
          metresAway: candidate.distance,
          direction: candidate.bearing,
        })),
      }
    }

    case 'locate_place': {
      const point = await geocode(String(args.query ?? ''))
      return point ? { latitude: point.lat, longitude: point.lng } : { error: 'not found' }
    }

    case 'list_datasets':
      return CONSTRAINT_DATASETS.map((d) => ({
        dataset: d.id,
        designation: d.label,
        meaning: d.hint,
        typicalNextStep: d.action,
      }))

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
