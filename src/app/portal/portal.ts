import createClient from "openapi-fetch";
import type { paths } from "./portal-schema-rest";

export const portal = createClient<paths>({ baseUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/proxy/portal` });
