import { useQuery } from "@tanstack/react-query";
import { isMockMode } from "@/_core/mock/mockMode";
import { mockQuery } from "@/_core/mock/mockTrpcFetch";
import { trpc } from "@/lib/trpc";

type ProjectGetInput = { id: number };

export function useTrpcQueryOrMock(
  queryName: "project.get",
  input: ProjectGetInput,
  options?: Parameters<typeof trpc.project.get.useQuery>[1]
) {
  const isMock = isMockMode();
  const enabled = options?.enabled ?? true;

  const mockResult = useQuery({
    queryKey: [queryName, input],
    queryFn: () => mockQuery(queryName, input),
    enabled: isMock && enabled,
  });

  const realResult = trpc.project.get.useQuery(input, {
    ...options,
    enabled: !isMock && enabled,
  });

  return (isMock ? mockResult : realResult) as typeof realResult;
}

