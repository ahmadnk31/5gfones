import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    
    // Get profiles with user data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
      
    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }
    
    // Get auth users information separately, only available in server functions
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }
    
    // Combine profile data with auth user data
    const users = authUsers.users.map((user: any) => {
      const profile = profiles.find((p: any) => p.id === user.id) || {
        role: 'customer',
        email_notifications: true,
        sms_notifications: false,
        preferred_language: 'en',
      };
      
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        profile: profile,
      };
    });
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in users GET route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, profile } = await request.json();
    const supabase = createAdminClient();
    
    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        role: profile.role,
        email_notifications: profile.email_notifications,
        sms_notifications: profile.sms_notifications,
        preferred_language: profile.preferred_language,
      })
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in users PUT route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const supabase = createAdminClient();
    
    // Delete user from auth
    const { error } = await supabase.auth.admin.deleteUser(id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in users DELETE route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
