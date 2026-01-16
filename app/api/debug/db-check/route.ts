import { NextResponse } from 'next/server'

// Ensure this route uses Node.js runtime (not Edge) for Prisma support
export const runtime = 'nodejs'

export async function GET() {
  console.log('[DB CHECK] ========== Diagnostic endpoint called ==========')
  
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
      nextRuntime: process.env.NEXT_RUNTIME,
      nextPhase: process.env.NEXT_PHASE,
      isServer: typeof window === 'undefined',
    },
    database: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'Not set',
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
      databaseUrlContainsPostgres: process.env.DATABASE_URL?.includes('postgres') || false,
      databaseUrlContainsSupabase: process.env.DATABASE_URL?.includes('supabase') || false,
    },
    prisma: {} as any,
  }

  // Step 1: Check if Prisma module can be imported
  let prismaModule: any = null
  let importError: any = null
  try {
    console.log('[DB CHECK] [1/6] Attempting to import Prisma module...')
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/debug/db-check/route.ts:30',message:'Before Prisma module import',data:{nodeEnv:process.env.NODE_ENV,isServer:typeof window === 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    prismaModule = await import('@/lib/prisma')
    console.log('[DB CHECK] [1/6] ✓ Prisma module imported successfully')
    diagnostics.prisma.moduleImported = true
    diagnostics.prisma.moduleExports = Object.keys(prismaModule || {})
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/debug/db-check/route.ts:33',message:'After Prisma module import',data:{moduleExports:Object.keys(prismaModule||{}),hasPrisma:'prisma' in prismaModule},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  } catch (error: any) {
    importError = {
      message: error.message,
      stack: error.stack,
      name: error.name,
    }
    console.error('[DB CHECK] [1/6] ✗ Failed to import Prisma module:', error.message)
    diagnostics.prisma.moduleImported = false
    diagnostics.prisma.importError = importError
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/debug/db-check/route.ts:42',message:'Prisma module import failed',data:{errorMessage:error.message,errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    return NextResponse.json(diagnostics, { status: 200 })
  }

  // Step 2: Check if prisma export exists
  let prismaInstance: any = null
  let prismaAccessError: any = null
  try {
    console.log('[DB CHECK] [2/6] Checking if prisma export exists...')
    if (prismaModule && 'prisma' in prismaModule) {
      prismaInstance = prismaModule.prisma
      console.log('[DB CHECK] [2/6] ✓ Prisma export found')
      diagnostics.prisma.exportExists = true
      diagnostics.prisma.exportType = typeof prismaInstance
      diagnostics.prisma.exportIsNull = prismaInstance === null
      diagnostics.prisma.exportIsUndefined = prismaInstance === undefined
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/debug/db-check/route.ts:52',message:'Prisma instance extracted',data:{exportType:typeof prismaInstance,isNull:prismaInstance===null,isUndefined:prismaInstance===undefined,hasUser:'user' in prismaInstance},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    } else {
      console.error('[DB CHECK] [2/6] ✗ Prisma export not found in module')
      diagnostics.prisma.exportExists = false
      diagnostics.prisma.availableExports = Object.keys(prismaModule || {})
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/debug/db-check/route.ts:59',message:'Prisma export not found',data:{availableExports:Object.keys(prismaModule||{})},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    }
  } catch (error: any) {
    prismaAccessError = {
      message: error.message,
      stack: error.stack,
    }
    console.error('[DB CHECK] [2/6] ✗ Error accessing prisma export:', error.message)
    diagnostics.prisma.exportExists = false
    diagnostics.prisma.accessError = prismaAccessError
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/debug/db-check/route.ts:68',message:'Error accessing prisma export',data:{errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
  }

  // Step 3: Inspect Prisma Client structure
  if (prismaInstance) {
    try {
      console.log('[DB CHECK] [3/6] Inspecting Prisma Client structure...')
      const prismaKeys = Object.keys(prismaInstance).filter(key => !key.startsWith('$') && !key.startsWith('_'))
      diagnostics.prisma.clientKeys = prismaKeys
      diagnostics.prisma.hasUserModel = 'user' in prismaInstance
      diagnostics.prisma.hasAccountModel = 'account' in prismaInstance
      diagnostics.prisma.hasSessionModel = 'session' in prismaInstance
      
      if ('user' in prismaInstance) {
        const userModel = prismaInstance.user
        diagnostics.prisma.userModelType = typeof userModel
        diagnostics.prisma.userModelKeys = typeof userModel === 'object' ? Object.keys(userModel || {}) : []
        diagnostics.prisma.hasUserCount = typeof userModel?.count === 'function'
        diagnostics.prisma.hasUserFindMany = typeof userModel?.findMany === 'function'
        console.log('[DB CHECK] [3/6] ✓ Prisma Client structure inspected')
        console.log('[DB CHECK] [3/6] User model available:', diagnostics.prisma.hasUserModel)
        console.log('[DB CHECK] [3/6] User model has count():', diagnostics.prisma.hasUserCount)
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/debug/db-check/route.ts:84',message:'User model inspection in route',data:{userModelType:typeof userModel,hasCount:typeof userModel?.count === 'function',hasFindMany:typeof userModel?.findMany === 'function',userModelKeys:diagnostics.prisma.userModelKeys.slice(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
      } else {
        console.warn('[DB CHECK] [3/6] ⚠ User model not found in Prisma Client')
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/debug/db-check/route.ts:93',message:'User model not found in route',data:{clientKeys:diagnostics.prisma.clientKeys.slice(0,10)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
      }
    } catch (error: any) {
      console.error('[DB CHECK] [3/6] ✗ Error inspecting Prisma Client:', error.message)
      diagnostics.prisma.inspectionError = {
        message: error.message,
        stack: error.stack,
      }
    }
  }

  // Step 4: Test database connection with $connect
  if (prismaInstance) {
    try {
      console.log('[DB CHECK] [4/6] Testing database connection with $connect()...')
      if (typeof prismaInstance.$connect === 'function') {
        await prismaInstance.$connect()
        console.log('[DB CHECK] [4/6] ✓ Database connection successful')
        diagnostics.prisma.connectionTest = 'success'
      } else {
        console.warn('[DB CHECK] [4/6] ⚠ $connect() method not available')
        diagnostics.prisma.connectionTest = 'method_not_available'
      }
    } catch (error: any) {
      console.error('[DB CHECK] [4/6] ✗ Database connection failed:', error.message)
      diagnostics.prisma.connectionTest = 'failed'
      diagnostics.prisma.connectionError = {
        message: error.message,
        code: error.code,
        stack: error.stack,
      }
    }
  }

  // Step 5: Test simple query (user.count)
  if (prismaInstance && diagnostics.prisma.hasUserCount) {
    try {
      console.log('[DB CHECK] [5/6] Testing user.count() query...')
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/debug/db-check/route.ts:130',message:'Before user.count() call',data:{hasPrismaInstance:!!prismaInstance,hasUserCount:diagnostics.prisma.hasUserCount,userModelType:typeof prismaInstance?.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      
      const userCount = await prismaInstance.user.count()
      console.log('[DB CHECK] [5/6] ✓ user.count() successful, count:', userCount)
      diagnostics.databaseConnected = true
      diagnostics.userCount = userCount
      diagnostics.prisma.queryTest = 'success'
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/debug/db-check/route.ts:133',message:'user.count() succeeded',data:{userCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
    } catch (error: any) {
      console.error('[DB CHECK] [5/6] ✗ user.count() query failed:', error.message)
      diagnostics.databaseConnected = false
      diagnostics.prisma.queryTest = 'failed'
      diagnostics.prisma.queryError = {
        message: error.message,
        code: error.code,
        stack: error.stack,
        errorName: error.name,
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/debug/db-check/route.ts:137',message:'user.count() failed',data:{errorMessage:error.message,errorName:error.name,errorCode:error.code,hasPrismaInstance:!!prismaInstance,hasUser:!!prismaInstance?.user,userType:typeof prismaInstance?.user,userIsFunction:typeof prismaInstance?.user === 'function',userIsObject:typeof prismaInstance?.user === 'object'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
    }
  } else {
    console.warn('[DB CHECK] [5/6] ⚠ Skipping user.count() - method not available')
    diagnostics.databaseConnected = false
    diagnostics.prisma.queryTest = 'skipped'
    diagnostics.prisma.querySkipReason = diagnostics.prisma.hasUserCount 
      ? 'Prisma instance not available' 
      : 'user.count() method not available'
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ee0c5773-6a51-4de8-ab8f-3590ca659613',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/debug/db-check/route.ts:148',message:'Skipping user.count()',data:{hasPrismaInstance:!!prismaInstance,hasUserCount:diagnostics.prisma.hasUserCount,skipReason:diagnostics.prisma.querySkipReason},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
  }

  // Step 6: Test findMany query
  if (diagnostics.databaseConnected && diagnostics.prisma.hasUserFindMany) {
    try {
      console.log('[DB CHECK] [6/6] Testing user.findMany() query...')
      const users = await prismaInstance.user.findMany({
        take: 5,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      console.log('[DB CHECK] [6/6] ✓ user.findMany() successful, found', users.length, 'users')
      diagnostics.sampleUsers = users
      
      // Additional counts
      if (diagnostics.prisma.hasAccountModel && typeof prismaInstance.account?.count === 'function') {
        diagnostics.accountCount = await prismaInstance.account.count()
      }
      if (diagnostics.prisma.hasSessionModel && typeof prismaInstance.session?.count === 'function') {
        diagnostics.sessionCount = await prismaInstance.session.count()
      }
    } catch (error: any) {
      console.error('[DB CHECK] [6/6] ✗ user.findMany() query failed:', error.message)
      diagnostics.findManyError = {
        message: error.message,
        code: error.code,
      }
    }
  } else {
    console.warn('[DB CHECK] [6/6] ⚠ Skipping user.findMany() - previous steps failed')
  }

  // Summary
  diagnostics.summary = {
    databaseConnected: diagnostics.databaseConnected || false,
    prismaInitialized: !!prismaInstance,
    canQueryDatabase: diagnostics.databaseConnected && diagnostics.prisma.queryTest === 'success',
    issues: [] as string[],
  }

  if (!diagnostics.database.hasDatabaseUrl) {
    diagnostics.summary.issues.push('DATABASE_URL environment variable is not set')
  }
  if (!diagnostics.prisma.moduleImported) {
    diagnostics.summary.issues.push('Failed to import Prisma module')
  }
  if (!diagnostics.prisma.exportExists) {
    diagnostics.summary.issues.push('Prisma export not found in module')
  }
  if (!diagnostics.prisma.hasUserModel) {
    diagnostics.summary.issues.push('User model not found in Prisma Client')
  }
  if (!diagnostics.prisma.hasUserCount) {
    diagnostics.summary.issues.push('user.count() method not available')
  }
  if (diagnostics.prisma.connectionTest === 'failed') {
    diagnostics.summary.issues.push('Database connection failed')
  }
  if (diagnostics.prisma.queryTest === 'failed') {
    diagnostics.summary.issues.push('Database query failed')
  }

  console.log('[DB CHECK] ========== Diagnostics complete ==========')
  console.log('[DB CHECK] Summary:', diagnostics.summary)
  
  return NextResponse.json(diagnostics, { status: 200 })
}
