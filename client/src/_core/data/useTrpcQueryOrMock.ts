import { useQuery } from "@tanstack/react-query";
import { isMockMode } from "@/_core/mock/mockMode";
import { mockQuery } from "@/_core/mock/mockTrpcFetch";
import { trpc } from "@/lib/trpc";

type ProjectGetInput = { id: number };
type UsageRecentInput = { projectId: number; limit?: number };

type QueryName = "project.get" | "usage.recent";

export function useTrpcQueryOrMock(
  queryName: "project.get",
  input: ProjectGetInput,
  options?: Parameters<typeof trpc.project.get.useQuery>[1]
): ReturnType<typeof trpc.project.get.useQuery>;
export function useTrpcQueryOrMock(
  queryName: "usage.recent",
  input: UsageRecentInput,
  options?: Parameters<typeof trpc.usage.recent.useQuery>[1]
): ReturnType<typeof trpc.usage.recent.useQuery>;
export function useTrpcQueryOrMock(
  queryName: QueryName,
  input: ProjectGetInput | UsageRecentInput,
  options?: { enabled?: boolean }
) {
  const isMock = isMockMode();
  const enabled = options?.enabled ?? true;

  const mockResult = useQuery({
    queryKey: [queryName, input],
    queryFn: () => mockQuery(queryName, input),
    enabled: isMock && enabled,
  });

  if (queryName === "project.get") {
    const real = trpc.project.get.useQuery(input as ProjectGetInput, {
      ...(options ?? {}),
      enabled: !isMock && enabled,
    });
    return (isMock ? mockResult : real) as ReturnType<typeof trpc.project.get.useQuery>;
  }

  const real = trpc.usage.recent.useQuery(input as UsageRecentInput, {
    ...(options ?? {}),
    enabled: !isMock && enabled,
  });
  return (isMock ? mockResult : real) as ReturnType<typeof trpc.usage.recent.useQuery>;
}

