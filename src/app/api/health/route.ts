// GET /api/health
import { NextResponse } from 'next/server';
import { getServiceStatus } from '@/lib/init';
import { isUsingMock } from '@/lib/config/database';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'MediaShare API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mockMode: isUsingMock(),
    services: getServiceStatus(),
  });
}
