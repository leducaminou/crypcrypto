// types/nextjs.ts
export interface RouteParams {
  params: Promise<{ [key: string]: string }>
}

export interface IdRouteParams {
  params: Promise<{ id: string }>
}

export interface SlugRouteParams {
  params: Promise<{ slug: string }>
}