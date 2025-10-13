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

    // Handle master admin user (hardcoded user)
    if (userId === 'master-admin') {
      console.log('🔍 Master admin user detected, returning hardcoded status');
      const response = {
        id: 'master-admin',
        role: 'admin',
        status: 'ACTIVE',
        patientId: null,
      };
      console.log('✅ Returning master admin status:', response);
      return NextResponse.json(response);
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

export async function PATCH(request: NextRequest) {
  try {
    console.log('🔍 API PATCH /api/user/status called');
    const body = await request.json();
    const { userId, status } = body;
    
    console.log('🔍 PATCH request body:', { userId, status });

    if (!userId || !status) {
      console.log('❌ Missing required fields');
      return NextResponse.json({ error: 'User ID and status are required' }, { status: 400 });
    }

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      console.log('❌ Invalid status value');
      return NextResponse.json({ error: 'Status must be ACTIVE or INACTIVE' }, { status: 400 });
    }

    // Handle master admin user (cannot be modified)
    if (userId === 'master-admin') {
      console.log('🔍 Master admin user cannot be modified');
      return NextResponse.json({ 
        error: 'Master admin user cannot be modified',
        id: 'master-admin',
        role: 'admin',
        status: 'ACTIVE',
        patientId: null,
      }, { status: 403 });
    }

    console.log('🔍 Calling updateUser with userId:', userId, 'status:', status);
    
    // Import updateUser function
    const { updateUser } = await import('@/lib/actions');
    
    // Update user status
    const updatedUser = await updateUser(userId, { status });
    
    console.log('✅ User status updated successfully:', updatedUser);

    const response = {
      id: updatedUser.id,
      role: updatedUser.role,
      status: updatedUser.status,
      patientId: updatedUser.userId,
    };
    
    console.log('✅ Returning updated user status:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error updating user status:', error);
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
