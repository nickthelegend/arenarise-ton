import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET endpoint to fetch transactions by wallet address
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet_address')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const { data: transactions, error } = await supabase
      .from('swap_transactions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching swap transactions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transaction history' },
        { status: 500 }
      )
    }

    return NextResponse.json({ transactions: transactions || [] })
  } catch (error: any) {
    console.error('Unexpected error in GET /api/swap/history:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint to record new swap transactions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wallet_address, ton_amount, rise_amount, status, transaction_hash, error_message } = body

    // Validate required fields
    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    if (!ton_amount || isNaN(parseFloat(ton_amount)) || parseFloat(ton_amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid TON amount is required' },
        { status: 400 }
      )
    }

    if (!rise_amount || isNaN(parseFloat(rise_amount)) || parseFloat(rise_amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid RISE amount is required' },
        { status: 400 }
      )
    }

    if (!status || !['pending', 'completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (pending, completed, or failed)' },
        { status: 400 }
      )
    }

    // Insert new transaction
    const { data: transaction, error: insertError } = await supabase
      .from('swap_transactions')
      .insert([
        {
          wallet_address,
          ton_amount: parseFloat(ton_amount),
          rise_amount: parseFloat(rise_amount),
          status,
          transaction_hash: transaction_hash || null,
          error_message: error_message || null
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating swap transaction:', insertError)
      return NextResponse.json(
        { error: 'Failed to record transaction' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transaction
    })
  } catch (error: any) {
    console.error('Unexpected error in POST /api/swap/history:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH endpoint to update transaction status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { transaction_id, status, transaction_hash, error_message } = body

    // Validate required fields
    if (!transaction_id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    if (!status || !['pending', 'completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (pending, completed, or failed)' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (transaction_hash !== undefined) {
      updateData.transaction_hash = transaction_hash
    }

    if (error_message !== undefined) {
      updateData.error_message = error_message
    }

    // Update transaction
    const { data: transaction, error: updateError } = await supabase
      .from('swap_transactions')
      .update(updateData)
      .eq('id', transaction_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating swap transaction:', updateError)
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transaction
    })
  } catch (error: any) {
    console.error('Unexpected error in PATCH /api/swap/history:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
