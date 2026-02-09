// GitHub Webhook Handler: Receives and processes GitHub events
import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import prisma from '@/lib/db'

// GitHub event types we handle
type GitHubEvent =
    | 'push'
    | 'pull_request'
    | 'issues'
    | 'issue_comment'
    | 'release'
    | 'create'
    | 'delete'
    | 'star'
    | 'fork'
    | 'ping'

interface GitHubPayload {
    action?: string
    ref?: string
    repository?: {
        name: string
        full_name: string
        html_url: string
    }
    sender?: {
        login: string
        avatar_url: string
    }
    commits?: Array<{
        id: string
        message: string
        author: { name: string; email: string }
        url: string
    }>
    pull_request?: {
        number: number
        title: string
        html_url: string
        state: string
        user: { login: string }
    }
    issue?: {
        number: number
        title: string
        html_url: string
        state: string
        user: { login: string }
    }
    release?: {
        tag_name: string
        name: string
        html_url: string
        body: string
    }
    zen?: string // For ping events
    hook_id?: number
}

// Verify GitHub signature (HMAC-SHA256)
function verifySignature(payload: string, signature: string | null, secret: string): boolean {
    if (!signature) return false

    const expectedSignature = `sha256=${createHmac('sha256', secret)
        .update(payload)
        .digest('hex')}`

    try {
        return timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        )
    } catch {
        return false
    }
}

// Format event for logging/notification
function formatEventMessage(event: GitHubEvent, payload: GitHubPayload): string {
    const repo = payload.repository?.full_name || 'unknown'
    const sender = payload.sender?.login || 'unknown'

    switch (event) {
        case 'ping':
            return `🏓 Webhook ping received! Zen: "${payload.zen}"`

        case 'push':
            const commits = payload.commits || []
            const branch = payload.ref?.replace('refs/heads/', '') || 'unknown'
            return `📦 Push to ${repo}/${branch} by ${sender}: ${commits.length} commit(s)`

        case 'pull_request':
            const pr = payload.pull_request
            return `🔀 PR #${pr?.number} ${payload.action}: "${pr?.title}" by ${pr?.user?.login}`

        case 'issues':
            const issue = payload.issue
            return `📋 Issue #${issue?.number} ${payload.action}: "${issue?.title}" by ${issue?.user?.login}`

        case 'release':
            const release = payload.release
            return `🚀 Release ${payload.action}: ${release?.tag_name} - ${release?.name}`

        case 'star':
            return `⭐ Repository ${payload.action === 'created' ? 'starred' : 'unstarred'} by ${sender}`

        case 'fork':
            return `🍴 Repository forked by ${sender}`

        default:
            return `📣 Event: ${event} - Action: ${payload.action || 'N/A'} by ${sender}`
    }
}

// POST /api/webhooks/github - Receive GitHub webhook events
export async function POST(request: NextRequest) {
    try {
        const signature = request.headers.get('x-hub-signature-256')
        const event = request.headers.get('x-github-event') as GitHubEvent | null
        const deliveryId = request.headers.get('x-github-delivery')

        // Get raw body for signature verification
        const rawBody = await request.text()

        // Verify signature if secret is configured
        const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
        if (webhookSecret) {
            if (!verifySignature(rawBody, signature, webhookSecret)) {
                console.error('[Webhook] Invalid GitHub signature')
                return NextResponse.json(
                    { error: 'Invalid signature' },
                    { status: 401 }
                )
            }
        }

        // Parse the payload
        const payload: GitHubPayload = JSON.parse(rawBody)

        // Format the message
        const message = formatEventMessage(event || 'ping', payload)

        console.log(`[Webhook] GitHub event received:`, {
            event,
            deliveryId,
            message,
            repository: payload.repository?.full_name,
            sender: payload.sender?.login,
        })

        // Log to audit trail
        try {
            await prisma.auditLog.create({
                data: {
                    action: 'WEBHOOK',
                    resource: 'github',
                    resourceId: deliveryId || `github-${Date.now()}`,
                    details: JSON.stringify({
                        event,
                        message,
                        repository: payload.repository?.full_name,
                        sender: payload.sender?.login,
                        timestamp: new Date().toISOString(),
                    }),
                    hash: createHmac('sha256', 'webhook')
                        .update(`${event}-${deliveryId}-${Date.now()}`)
                        .digest('hex'),
                }
            })
        } catch (dbError) {
            // Don't fail the webhook if DB logging fails
            console.error('[Webhook] Failed to log to database:', dbError)
        }

        // Optional: Forward to Discord/Slack
        // You can add additional webhook forwarding here
        const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL
        if (discordWebhookUrl && event !== 'ping') {
            await forwardToDiscord(discordWebhookUrl, event || 'unknown', payload, message)
        }

        const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
        if (slackWebhookUrl && event !== 'ping') {
            await forwardToSlack(slackWebhookUrl, event || 'unknown', payload, message)
        }

        return NextResponse.json({
            success: true,
            message: 'Webhook received',
            event,
            deliveryId,
        })

    } catch (error) {
        console.error('[Webhook] Error processing GitHub webhook:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET /api/webhooks/github - Health check endpoint
export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        service: 'NCTIRS GitHub Webhook Handler',
        version: '1.0.0',
        endpoints: {
            webhook: 'POST /api/webhooks/github',
            health: 'GET /api/webhooks/github',
        },
        supportedEvents: [
            'push',
            'pull_request',
            'issues',
            'issue_comment',
            'release',
            'create',
            'delete',
            'star',
            'fork',
            'ping',
        ],
        configuration: {
            signatureVerification: !!process.env.GITHUB_WEBHOOK_SECRET,
            discordForwarding: !!process.env.DISCORD_WEBHOOK_URL,
            slackForwarding: !!process.env.SLACK_WEBHOOK_URL,
        }
    })
}

// Forward webhook to Discord
async function forwardToDiscord(
    webhookUrl: string,
    event: string,
    payload: GitHubPayload,
    message: string
) {
    try {
        const embed = {
            title: `GitHub: ${event}`,
            description: message,
            color: getEventColor(event),
            fields: [
                {
                    name: 'Repository',
                    value: payload.repository?.full_name || 'N/A',
                    inline: true,
                },
                {
                    name: 'Triggered by',
                    value: payload.sender?.login || 'N/A',
                    inline: true,
                },
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: 'NCTIRS Webhook Handler',
            },
        }

        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'NCTIRS GitHub Bot',
                embeds: [embed],
            }),
        })
    } catch (error) {
        console.error('[Webhook] Failed to forward to Discord:', error)
    }
}

// Forward webhook to Slack
async function forwardToSlack(
    webhookUrl: string,
    event: string,
    payload: GitHubPayload,
    message: string
) {
    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: message,
                attachments: [
                    {
                        color: getEventColorHex(event),
                        fields: [
                            {
                                title: 'Event',
                                value: event,
                                short: true,
                            },
                            {
                                title: 'Repository',
                                value: payload.repository?.full_name || 'N/A',
                                short: true,
                            },
                        ],
                        footer: 'NCTIRS Webhook Handler',
                        ts: Math.floor(Date.now() / 1000),
                    },
                ],
            }),
        })
    } catch (error) {
        console.error('[Webhook] Failed to forward to Slack:', error)
    }
}

// Get Discord embed color for event type
function getEventColor(event: string): number {
    const colors: Record<string, number> = {
        push: 0x2ea44f,      // Green
        pull_request: 0x6f42c1, // Purple
        issues: 0xd73a49,    // Red
        release: 0x0366d6,   // Blue
        star: 0xf9a825,      // Gold
        fork: 0x586069,      // Gray
    }
    return colors[event] || 0x586069
}

// Get Slack color for event type
function getEventColorHex(event: string): string {
    const colors: Record<string, string> = {
        push: '#2ea44f',
        pull_request: '#6f42c1',
        issues: '#d73a49',
        release: '#0366d6',
        star: '#f9a825',
        fork: '#586069',
    }
    return colors[event] || '#586069'
}
