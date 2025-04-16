"use client";

import { useState } from "react";
import {
  AddParticipantButton,
  EditButton,
  DeleteButton,
  DuplicateButton,
} from "~/features/admin";

export default function ButtonShowcasePage() {
  const [processing, setProcessing] = useState<string | null>(null);

  const simulateProcessing = (type: string) => {
    setProcessing(type);
    setTimeout(() => setProcessing(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Button Showcase</h1>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Add Participant Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <AddParticipantButton onClick={() => alert("Add Participant")} />
          <AddParticipantButton
            isFirst
            onClick={() => alert("Add First Participant")}
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">
          Action Buttons - Normal Size
        </h2>
        <div className="flex flex-wrap gap-4">
          <EditButton
            onClick={() => simulateProcessing("edit")}
            isProcessing={processing === "edit"}
          />
          <DuplicateButton
            onClick={() => simulateProcessing("duplicate")}
            isProcessing={processing === "duplicate"}
          />
          <DeleteButton
            onClick={() => simulateProcessing("delete")}
            isProcessing={processing === "delete"}
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">
          Action Buttons - Small Size
        </h2>
        <div className="flex flex-wrap gap-4">
          <EditButton
            size="sm"
            onClick={() => simulateProcessing("edit-sm")}
            isProcessing={processing === "edit-sm"}
          />
          <DuplicateButton
            size="sm"
            onClick={() => simulateProcessing("duplicate-sm")}
            isProcessing={processing === "duplicate-sm"}
          />
          <DeleteButton
            size="sm"
            onClick={() => simulateProcessing("delete-sm")}
            isProcessing={processing === "delete-sm"}
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Disabled Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <AddParticipantButton disabled />
          <EditButton disabled />
          <DuplicateButton disabled />
          <DeleteButton disabled />
        </div>
      </div>
    </div>
  );
}
