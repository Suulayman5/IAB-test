import { NextResponse } from 'next/server';
import axios from 'axios';
import clientPromise from '@/lib/mongo';

export async function POST(req: Request) {
    const body = await req.json();
    const { phone, firstLevel, amount } = body;
  
    if (!phone || !firstLevel || !amount) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
  
    const apiKey = process.env.IAB_API_KEY;
    const secretKey = process.env.IAB_SECRET_KEY;
  
    const headers = {
      'Content-Type': 'application/json',
      'api-key': apiKey!,
      'secret-key': secretKey!,
    };
  
    try {
      const apiRes = await axios.post(
        'https://iabconcept.com/api/airtimeapi',
        {
          phone,
          firstLevel,
          amount,
        },
        { headers }
      );
  
      const status = apiRes.data?.airtimeHistory?.[0]?.status || 'Unknown';
      const responseMessage = apiRes.data?.airtimeHistory?.[0]?.logs?.response_description || 'No description';
  
      // Save transaction to MongoDB with status and response message
      const client = await clientPromise;
      const db = client.db();
      await db.collection('airtime_transactions').insertOne({
        phone,
        network: firstLevel,
        amount,
        status,
        response: apiRes.data,
        timestamp: new Date(),
      });
  
      if (status === 'Failed') {
        return NextResponse.json({
          message: 'Airtime purchase failed',
          data: apiRes.data,
          error: responseMessage,
        }, { status: 400 });
      }
  
      return NextResponse.json({ message: 'Airtime purchase successful', data: apiRes.data });
  
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'API error';
      const responseHistory = err.response?.data?.airtimeHistory || null;
  
      // Log the error response in MongoDB
      const client = await clientPromise;
      const db = client.db();
      await db.collection('airtime_transactions').insertOne({
        phone,
        network: firstLevel,
        amount,
        status: 'Failed',
        response: errorMessage,
        timestamp: new Date(),
      });
  
      return NextResponse.json({
        error: errorMessage,
        data: responseHistory,
      }, { status: err.response?.status || 500 });
    }
  }
  
export async function GET() {
    const apiKey = process.env.IAB_API_KEY;
    const secretKey = process.env.IAB_SECRET_KEY;
  
    if (!apiKey || !secretKey) {
      return NextResponse.json({ error: 'API credentials are not configured.' }, { status: 500 });
    }
    try {
      const res = await axios.get('https://iabconcept.com/api/airtimeapi', {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
          'secret-key': secretKey,
        },
      });

      return NextResponse.json(res.data);
    } catch (err: any) {
      return NextResponse.json(
        { error: err.response?.data?.error || 'Failed to fetch network list' },
        { status: err.response?.status || 500 }
      );
    }
  }
