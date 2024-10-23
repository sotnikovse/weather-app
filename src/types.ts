export interface ApiResponse {
  latitude: number
  longitude: number
  elevation: number
  generationtime_ms: number
  utc_offset_seconds: number
  timezone: string
  timezone_abbreviation: string
  hourly_units: {
    time: string
    temperature_2m: string
    relative_humidity_2m: string
    precipitation_probability: string
    cloud_cover: string
    visibility: string
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    relative_humidity_2m: number[]
    precipitation_probability: number[]
    cloud_cover: number[]
    visibility: number[]
  }
}

export interface ApiError {
  error: boolean
  reason: string
}

export interface ChartGradient {
  gradient: CanvasGradient | undefined
  width: number
  height: number
}

export interface ChartGradientColor {
  offset: number
  color: string
}
