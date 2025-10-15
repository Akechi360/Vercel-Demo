import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Test API /api/user/status/test called');
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log('🧪 User ID from params:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Return mock data for testing
    const mockUserStatus = {
      id: userId,
      role: 'patient',
      status: 'ACTIVE',
      patientId: null,
    };
    
    console.log('🧪 Returning mock user status:', mockUserStatus);
    return NextResponse.json(mockUserStatus);
  } catch (error) {
    console.error('❌ Test API error:', error);
    return NextResponse.json({ 
      error: 'Test API error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
