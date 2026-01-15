import { NextResponse } from 'next/server'

// Mock clients data - stored in memory for demo (will be lost on server restart)
let mockClients = [
  {
    id: '1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    website: 'https://acme.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'TechStart Inc',
    email: 'hello@techstart.com',
    website: 'https://techstart.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Digital Solutions LLC',
    email: 'info@digitalsolutions.com',
    website: 'https://digitalsolutions.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export async function GET() {
  try {
    // For demo: return mock clients without database
    // In production with database:
    // const session = await getServerSession(authOptions)
    // if (session?.user?.email) {
    //   const user = await prisma.user.findUnique({
    //     where: { email: session.user.email }
    //   })
    //   const clients = await prisma.client.findMany({
    //     where: { userId: user.id }
    //   })
    //   return NextResponse.json(clients)
    // }
    
    return NextResponse.json(mockClients)
  } catch (error) {
    console.error('Clients API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // For demo: create client in memory
    // In production with database:
    // const session = await getServerSession(authOptions)
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    // const user = await prisma.user.findUnique({
    //   where: { email: session.user.email }
    // })
    // const newClient = await prisma.client.create({
    //   data: { ...body, userId: user.id }
    // })
    
    const newClient = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Add to mock clients array
    mockClients = [...mockClients, newClient]
    
    return NextResponse.json(newClient, { status: 201 })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json(
      { error: 'Failed to create client', details: String(error) },
      { status: 500 }
    )
  }
}
