"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";

interface ConfirmDialogProps {
  title: string;
  description?: string;
  onConfirm: () => void;
  trigger: React.ReactNode;
}

export default function ConfirmDialog({
  title,
  description,
  onConfirm,
  trigger,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[9998] bg-black/60" />

        <AlertDialog.Content
          className="fixed z-[9999] top-1/2 left-1/2 w-[90vw] max-w-md 
  -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl"
        >
          <AlertDialog.Title className="text-lg font-semibold">
            {title}
          </AlertDialog.Title>

          {description && (
            <AlertDialog.Description className="mt-2 text-sm text-gray-600">
              {description}
            </AlertDialog.Description>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel className="rounded-md border px-4 py-2 text-sm">
              Batal
            </AlertDialog.Cancel>

            <AlertDialog.Action
              onClick={onConfirm}
              className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              Ya, lanjutkan
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
