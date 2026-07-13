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

    if (!start || !name || !email) {
      return NextResponse.json(
        { 
          error: "Missing required fields", 
          message: "Please provide 'start' (ISO string), 'name', and 'email'." 
        },
        { status: 400 }
      );
    }

    // Construct the Cal.com API URL
    const calApiUrl = new URL("https://api.cal.com/v1/bookings");
    calApiUrl.searchParams.append("apiKey", apiKey);

    // Prepare booking payload for Cal.com
    const bookingPayload = {
      eventTypeId: parseInt(eventTypeId, 10),
      start,
      responses: {
        name,
        email,
        phone: phone || "",
        notes: notes || "Booked via AI Voice Agent"
      },
      metadata: {
        source: "AI Voice Agent"
      },
      timeZone: "UTC", // Defaulting to UTC, can be passed by client if needed
      language: "en"
    };

    // Make the booking via Cal.com
    const response = await fetch(calApiUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Cal.com API error details:", errText);
      throw new Error(`Cal.com Booking API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: "Successfully booked the meeting.",
      bookingId: data.booking?.id || data.id,
      meetingUrl: data.booking?.metadata?.videoCallUrl || data.videoCallUrl,
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
