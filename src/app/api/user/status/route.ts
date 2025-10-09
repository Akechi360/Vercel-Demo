import { NextRequest, NextResponse } from 'next/server';
import { getUserStatusForAccess } from '@/lib/actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get fresh user status from database
    const userStatus = await getUserStatusForAccess(userId);

    if (!userStatus) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: userStatus.id,
      role: userStatus.role,
      status: userStatus.status,
      patientId: userStatus.patientId,
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
