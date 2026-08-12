import { create } from "zustand";

export interface MasterApprovalRequest {
  id: string;
  targetType: "得意先" | "商品";
  targetName: string;
  requestedBy: string;
  status: "承認待ち" | "承認済み";
  history: { actor: string; role: string; action: string; at: string }[];
}

interface MasterApprovalStore {
  requests: MasterApprovalRequest[];
  submitRequest: (targetType: "得意先" | "商品", targetName: string, requestedBy: string) => void;
  approve: (id: string, actor: string, role: string) => void;
}

export const useMasterApprovalStore = create<MasterApprovalStore>((set) => ({
  requests: [],
  submitRequest: (targetType, targetName, requestedBy) =>
    set((state) => ({
      requests: [
        ...state.requests,
        {
          id: `req-${state.requests.length + 1}`,
          targetType,
          targetName,
          requestedBy,
          status: "承認待ち",
          history: [{ actor: requestedBy, role: "申請者", action: "申請", at: "2026-06-19" }],
        },
      ],
    })),
  approve: (id, actor, role) =>
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id
          ? { ...r, status: "承認済み", history: [...r.history, { actor, role, action: "承認", at: "2026-06-20" }] }
          : r
      ),
    })),
}));
