import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
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

    // Determine start and end dates (default: today to 7 days from now)
    const defaultStartDate = new Date();
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 7);

    const startTime = searchParams.get("startDate") || defaultStartDate.toISOString();
    const endTime = searchParams.get("endDate") || defaultEndDate.toISOString();

    // Construct the Cal.com API URL
    // Cal.com v1 uses apiKey query param for auth
    const calApiUrl = new URL("https://api.cal.com/v1/slots");
    calApiUrl.searchParams.append("eventTypeId", eventTypeId);
    calApiUrl.searchParams.append("startTime", startTime);
    calApiUrl.searchParams.append("endTime", endTime);
    calApiUrl.searchParams.append("apiKey", apiKey);

    // Fetch availability from Cal.com
    const response = await fetch(calApiUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Cal.com API error details:", errText);
      throw new Error(`Cal.com API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Simplify the payload for the AI voice agent
    // data.slots is typically an object with keys as dates and values as arrays of slot objects
    const availableSlots = data.slots || {};

    return NextResponse.json({
      success: true,
      message: "Successfully retrieved available calendar slots.",
      queryRange: {
        startTime,
        endTime
      },
      availableSlots
    });

  } catch (error: any) {
    console.error("Calendar availability API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch calendar availability." },
      { status: 500 }
    );
  }
}
