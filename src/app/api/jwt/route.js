import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const decodedToken = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Token not found' }, 
        { status: 401 }
      );
    }

    const rawJwtToken = jwt.sign(
      decodedToken,
      process.env.NEXTAUTH_SECRET,
      { algorithm: 'HS256' }
    );

    return NextResponse.json({
      success: true,
      jwt: rawJwtToken,
      accessToken: decodedToken.accessToken,
      user: {
        id: decodedToken.id,
        username: decodedToken.username,
        email: decodedToken.email,
        role: decodedToken.role
      }
    });

  } catch (error) {
    console.error('JWT API Error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message }, 
      { status: 500 }
    );
  }
}