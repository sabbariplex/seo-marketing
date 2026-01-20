import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database
    const prismaModule = await import('@/lib/prisma')
    const prisma = prismaModule?.prisma
    
    if (!prisma) {
      console.error('[API] Prisma module invalid:', { hasModule: !!prismaModule, hasPrisma: !!prisma })
      return NextResponse.json(
        { error: 'Database client unavailable', details: 'Prisma module not loaded' },
        { status: 500 }
      )
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'logos')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${user.id}-${timestamp}.${extension}`
    const filepath = join(uploadsDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Generate public URL
    const logoUrl = `/uploads/logos/${filename}`

    // Update branding with logo URL
    const updatePrismaModule = await import('@/lib/prisma')
    const updatePrisma = updatePrismaModule?.prisma
    
    if (!updatePrisma) {
      console.error('[API] Prisma module invalid for update:', { hasModule: !!updatePrismaModule, hasPrisma: !!updatePrisma })
      return NextResponse.json(
        { error: 'Database client unavailable', details: 'Prisma module not loaded' },
        { status: 500 }
      )
    }
    
    await updatePrisma.branding.upsert({
      where: { userId: user.id },
      update: { logoUrl },
      create: {
        userId: user.id,
        logoUrl,
      },
    })

    return NextResponse.json({
      success: true,
      logoUrl,
      message: 'Logo uploaded successfully'
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'
    console.error('[POST /api/branding/upload] Error:', { message: errorMsg, stack: errorStack, error })
    return NextResponse.json(
      { error: 'Failed to upload logo', details: errorMsg, stack: process.env.NODE_ENV === 'development' ? errorStack : undefined },
      { status: 500 }
    )
  }
}
