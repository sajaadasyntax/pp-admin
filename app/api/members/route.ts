import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    console.log('API: Starting members fetch request');
    
    // Get the token from cookies
    const token = cookies().get('token')?.value;
    console.log('API: Token present:', !!token);

    if (!token) {
      console.log('API: No token found');
      return NextResponse.json(
        { message: 'غير مصرح لك' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    console.log('API: Fetching members with params:', { page, limit, search });

    // Make the API call to the backend
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/members?page=${page}&limit=${limit}&search=${search}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('API: Backend response status:', response.status);

    if (!response.ok) {
      let errorMessage = 'حدث خطأ أثناء جلب البيانات';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.log('API: Backend error details:', errorData);
      } catch (e) {
        console.log('API: Could not parse error response');
      }
      
      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('API: Successfully fetched members');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Error fetching members:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('API: Starting member creation request');
    
    // Get the token from cookies
    const token = cookies().get('token')?.value;
    console.log('API: Token present:', !!token);

    if (!token) {
      console.log('API: No token found');
      return NextResponse.json(
        { message: 'غير مصرح لك' },
        { status: 401 }
      );
    }

    // Get the member data from the request body
    const memberData = await request.json();
    console.log('API: Received member data:', memberData);

    // Validate required fields
    const requiredFields = ['fullName', 'nationalId', 'mobile', 'email'];
    const missingFields = requiredFields.filter(field => !memberData[field]);
    
    if (missingFields.length > 0) {
      console.log('API: Missing required fields:', missingFields);
      return NextResponse.json(
        { message: `الحقول المطلوبة مفقودة: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Make the API call to the backend
    console.log('API: Making request to backend:', `${process.env.NEXT_PUBLIC_API_URL}/members`);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(memberData)
    });

    console.log('API: Backend response status:', response.status);

    if (!response.ok) {
      let errorMessage = 'حدث خطأ أثناء إضافة العضو';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.log('API: Backend error details:', errorData);
      } catch (e) {
        console.log('API: Could not parse error response');
      }
      
      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('API: Successfully created member');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Error creating member:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء إضافة العضو' },
      { status: 500 }
    );
  }
} 