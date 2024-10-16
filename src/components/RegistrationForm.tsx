"use client";
import React, { useEffect, useState } from "react";

type Event = {
  id: string;
  price: number;
  from: string;
  to: string;
  created_at: string;
};

const RegistrationForm: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [formData, setFormData] = useState({
    eventId: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    paymentType: "credit_card", // default value
  });

  // Fetch events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        try {
          const response = await fetch("/api/events/all");
          if (!response.ok) throw new Error("Network response was not ok");
          const data = (await response.json()) as Event[];
          setEvents(data);
        } catch (error) {
          console.error("Failed to fetch events:", error);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };
    fetchEvents().catch((error) => {
      console.error("Failed to fetch events:", error);
    });
  }, []);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Submit the registration form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      alert("Registration successful!");
    } catch (error) {
      console.error("Failed to register:", error);
      alert("Registration failed.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-lg flex-col gap-6 rounded-lg bg-white p-8 shadow-lg"
    >
      <div>
        <label
          htmlFor="eventId"
          className="mb-2 block font-semibold text-gray-700"
        >
          Select Event
        </label>
        <select
          name="eventId"
          onChange={handleChange}
          value={formData.eventId}
          required
          className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Choose an event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              Event from {new Date(event.from).toLocaleDateString()} to{" "}
              {new Date(event.to).toLocaleDateString()} - ${event.price}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="firstName"
          className="mb-2 block font-semibold text-gray-700"
        >
          First Name
        </label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
          className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label
          htmlFor="lastName"
          className="mb-2 block font-semibold text-gray-700"
        >
          Last Name
        </label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
          className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label
          htmlFor="email"
          className="mb-2 block font-semibold text-gray-700"
        >
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label
          htmlFor="phoneNumber"
          className="mb-2 block font-semibold text-gray-700"
        >
          Phone Number
        </label>
        <input
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label
          htmlFor="paymentType"
          className="mb-2 block font-semibold text-gray-700"
        >
          Payment Type
        </label>
        <select
          name="paymentType"
          onChange={handleChange}
          value={formData.paymentType}
          className="w-full rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="CASH">CASH</option>
          <option value="CARD">CARD</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-indigo-600 p-2 font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        Register
      </button>
    </form>
  );
};
export default RegistrationForm;
