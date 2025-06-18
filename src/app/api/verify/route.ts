import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic'; // Ensures the route is server-side only



interface WorldcoinVerifyResponse {
  verified?: boolean;
  code?: string;
  detail?: string;
  attribute_type?: string; // World ID v2 can return this
  action?: string; // World ID v2 can return this
  signal?: string; // World ID v2 can return this
  nullifier_hash?: string; // World ID v2 can return this
  created_at?: string; // World ID v2 can return this
}


export async function verifyPost(request: Request) {
  try {
    const proof = await request.json();

    if (!proof) {
      return NextResponse.json(
        { error: 'Proof is required in the request body' },
        { status: 400 }
      );
    }

    // It's good practice to use environment variables for sensitive URLs or app IDs
    const worldcoinVerifyUrl = process.env.WORLDCOIN_VERIFY_URL || 'https://developer.worldcoin.org/api/v2/verify/app_staging_129259332fd6f93d4fabaadcc5e4ff9d';
    const action = proof.action || "test"; // Use action from proof if available, otherwise default

    const response = await fetch(
      worldcoinVerifyUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Spread the received proof and ensure the action is included
        // The Worldcoin API expects the action to be part of the main proof object
        body: JSON.stringify({ ...proof, action }),
      }
    );

    const responseData: WorldcoinVerifyResponse = await response.json();

    if (response.ok) {
      // Successfully verified or not, the 'verified' field should be present
      return NextResponse.json({ verified: responseData.verified });
    } else {
      // Handle errors from Worldcoin API
      console.error(`Worldcoin API Error: Code ${responseData.code} - ${responseData.detail}`);
      return NextResponse.json(
        { error: `Error Code ${responseData.code}: ${responseData.detail}` },
        { status: response.status } // Forward the status from Worldcoin API
      );
    }
  } catch (error) {
    console.error('Error in verify-worldcoin API:', error);
    let errorMessage = 'Failed to verify proof';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}