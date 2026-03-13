'use client';

import { useActionState } from 'react';
import { triggerContainmentAction, ContainmentState } from '@/lib/nctirs/actions/security';

export function ContainmentPanel({ incidentId }: { incidentId: string }) {
    // React 19 Action State
    const [state, formAction, isPending] = useActionState<ContainmentState, FormData>(triggerContainmentAction, null);

    return (
        <div className="border-2 border-red-900 bg-black p-4 font-mono text-green-500">
            <h3 className="mb-2 uppercase text-red-500 underline">SOAR Intervention Protocol</h3>

            <form action={formAction}>
                <input type="hidden" name="id" value={incidentId} />

                <div className="grid grid-cols-1 gap-2">
                    <button
                        name="protocol"
                        value="ISOLATE_NETWORK"
                        className="border border-green-500 p-2 hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isPending}
                    >
                        [ EXECUTE NETWORK ISOLATION ]
                    </button>

                    <button
                        name="protocol"
                        value="SUSPEND_AUTH"
                        className="border border-green-500 p-2 hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isPending}
                    >
                        [ SUSPEND COMPROMISED ACCOUNTS ]
                    </button>
                </div>
            </form>

            {isPending && <div className="mt-2 animate-pulse text-yellow-500">{">>>"} INITIALIZING PROTOCOL...</div>}
            {state?.success && (
                <>
                    <div className="mt-2 text-blue-400 mb-4">{">>>"} SYSTEM STATUS: CONTAINED</div>
                    <button className="w-full border border-green-500 bg-green-950/20 p-2 text-xs font-bold text-green-400 hover:bg-green-900/40 hover:text-green-200 transition-colors flex items-center justify-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        [ DOWNLOAD ODPC COMPLIANCE REPORT ]
                    </button>
                </>
            )}
        </div>
    );
}
