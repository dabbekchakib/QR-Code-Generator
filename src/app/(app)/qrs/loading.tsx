import { QRGridSkeleton } from "@/features/qr/components/library/qr-skeleton";

export default function QRLibraryLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      <QRGridSkeleton count={8} />
    </div>
  );
}