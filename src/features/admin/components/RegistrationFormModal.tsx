import React from "react";
import { Button } from "~/shared/components/ui/button";
import { Registration } from "~/stores/registrationStore";

interface RegistrationFormModalProps {
  formType: "add" | "edit" | "duplicate";
  currentRegistration: Registration | null;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    paymentType: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      paymentType: string;
    }>
  >;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  processing: boolean;
}

const RegistrationFormModal: React.FC<RegistrationFormModalProps> = ({
  formType,
  currentRegistration,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  processing,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl transition-all">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">
            {formType === "add"
              ? "Add New Participant"
              : formType === "duplicate"
                ? "Duplicate Participant"
                : "Edit Participant"}
          </h2>
        </div>
        <form onSubmit={onSubmit} className="p-6">
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  First Name*
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="First name"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Email*
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="+420 123 456 789"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="paymentType"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Payment Type*
              </label>
              <select
                id="paymentType"
                name="paymentType"
                value={formData.paymentType}
                onChange={(e) =>
                  setFormData({ ...formData, paymentType: e.target.value })
                }
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="CASH">Cash on Site</option>
                <option value="QR">QR Code Payment</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto"
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={processing}
              className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto"
            >
              {processing ? (
                <span className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : formType === "add" ? (
                "Add Participant"
              ) : formType === "duplicate" ? (
                "Duplicate Participant"
              ) : (
                "Update Participant"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationFormModal;
