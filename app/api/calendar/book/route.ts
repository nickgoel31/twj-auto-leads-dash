import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check for API Keys in environment variables
    const apiKey = process.env.CAL_API_KEY;
    const eventTypeId = process.env.CAL_EVENT_TYPE_ID;

    if (!apiKey || !eventTypeId) {
      return NextResponse.json(
        { 
          error: "Missing Cal.com configuration", 
          message: "Please ensure CAL_API_KEY and CAL_EVENT_TYPE_ID are set in your environment variables." 
        },
        { status: 500 }
      );
    }

    const { start, name, email, phone, notes } = body;

    if (!start || !name) {
      return NextResponse.json(
        { 
          error: "Missing required fields", 
          message: "Please provide 'start' (ISO string) and 'name'." 
        },
        { status: 400 }
      );
    }

    // Construct the Cal.com API URL for v2
    const calApiUrl = new URL("https://api.cal.com/v2/bookings");

    // Prepare booking payload for Cal.com v2
    // Convert the provided start time to a strict UTC ISO string (ending in Z)
    const utcStart = new Date(start).toISOString();

    const bookingPayload = {
      start: utcStart,
      eventTypeId: parseInt(eventTypeId, 10),
      attendee: {
        name,
        email: email || "guest@example.com", // Cal.com usually requires an email, so we provide a fallback
        timeZone: "UTC",
        language: "en"
      }
    };
    
    // Add phone to attendee if provided
    if (phone) {
      (bookingPayload as any).attendee.phoneNumber = phone;
    }

    // Make the booking via Cal.com
    const response = await fetch(calApiUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "cal-api-version": "2024-08-13"
      },
      body: JSON.stringify(bookingPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Cal.com API error details:", errText);
      return NextResponse.json(
        { 
          error: `Cal.com Booking API error: ${response.status} ${response.statusText}`, 
          details: errText 
        },
        { status: 400 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: "Successfully booked the meeting.",
      bookingId: data.data?.id || data.id,
      meetingUrl: data.data?.metadata?.videoCallUrl || data.data?.videoCallUrl || null,
      raw: data
    });

  } catch (error: any) {
    console.error("Calendar booking API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to book meeting." },
      { status: 500 }
    );
  }
}
