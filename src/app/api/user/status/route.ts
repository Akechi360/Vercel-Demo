import { NextRequest, NextResponse } from 'next/server';
import { getUserStatusForAccess } from '@/lib/actions';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API /api/user/status called');
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log('🔍 User ID from params:', userId);
    console.log('🔍 Full URL:', request.url);
    console.log('🔍 Search params:', Object.fromEntries(searchParams.entries()));

    if (!userId) {
      console.log('❌ No user ID provided');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔍 Calling getUserStatusForAccess with userId:', userId);
    
    // Get fresh user status from database
    const userStatus = await getUserStatusForAccess(userId);
    
    console.log('🔍 getUserStatusForAccess result:', userStatus);

    if (!userStatus) {
      console.log('❌ User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const response = {
      id: userStatus.id,
      role: userStatus.role,
      status: userStatus.status,
      patientId: userStatus.patientId,
    };
    
    console.log('✅ Returning user status:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error fetching user status:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
