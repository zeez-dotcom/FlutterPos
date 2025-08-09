import { useQuery } from "@tanstack/react-query";
import type { Branch } from "@shared/schema";
import { QRCodeCanvas } from "qrcode.react";

interface BranchWithUrl extends Branch {
  deliveryUrl: string;
}

export function BranchDeliveryPage() {
  const { data: branches = [] } = useQuery<BranchWithUrl[]>({
    queryKey: ["/api/branches"],
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
      {branches.map((branch) => (
      <div key={branch.id} className="p-4 border rounded-md flex flex-col items-center gap-2">
        <h2 className="font-semibold text-lg text-center">{branch.name}</h2>
        <QRCodeCanvas value={origin + branch.deliveryUrl} size={128} />
        <p className="text-sm break-all text-center">{origin + branch.deliveryUrl}</p>
      </div>
      ))}
    </div>
  );
}

export default BranchDeliveryPage;
