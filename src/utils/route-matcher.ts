import type Link from "next/link";
import type { NextRequest } from "next/server";
import { pathToRegexp } from "path-to-regexp";

type Autocomplete<U extends T, T = string> = U | (T & Record<never, never>);

export const paths = {
  toRegexp: (path: string) => {
    try {
      return pathToRegexp(path);
    } catch (e) {
      throw new Error(
        `Invalid path: ${path}.\nConsult the documentation of path-to-regexp here: https://github.com/pillarjs/path-to-regexp\n${(e as Error).message}`,
      );
    }
  },
};

type WithPathPatternWildcard<T> = `${T & string}(.*)`;
type NextTypedRoute<T = Parameters<typeof Link>["0"]["href"]> = T extends string ? T : never;

type RouteMatcherWithNextTypedRoutes = Autocomplete<WithPathPatternWildcard<NextTypedRoute> | NextTypedRoute>;

export type RouteMatcherParam =
  | Array<RegExp | RouteMatcherWithNextTypedRoutes>
  | RegExp
  | RouteMatcherWithNextTypedRoutes
  | ((req: NextRequest) => boolean);

/**
 * Returns a function that accepts a `Request` object and returns whether the request matches the list of
 * predefined routes that can be passed in as the first argument.
 *
 * You can use glob patterns to match multiple routes or a function to match against the request object.
 * Path patterns and regular expressions are supported, for example: `['/foo', '/bar(.*)'] or `[/^\/foo\/.*$/]`
 * For more information, see: https://clerk.com/docs
 */
export const createRouteMatcher = (routes: RouteMatcherParam) => {
  if (typeof routes === "function") {
    return (req: NextRequest) => routes(req);
  }

  const routePatterns = [routes || ""].flat().filter(Boolean);
  const matchers = precomputePathRegex(routePatterns);
  return (req: NextRequest) => matchers.some((matcher) => matcher.test(req.nextUrl.pathname));
};

const precomputePathRegex = (patterns: Array<string | RegExp>) => {
  return patterns.map((pattern) => (pattern instanceof RegExp ? pattern : paths.toRegexp(pattern)));
};
