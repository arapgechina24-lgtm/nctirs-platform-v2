'use server';

export type ContainmentState = {
    success?: boolean;
    message?: string;
    timestamp?: string;
} | null;

export async function triggerContainmentAction(prevState: ContainmentState, formData: FormData): Promise<ContainmentState> {
    const id = formData.get('id');
    const protocol = formData.get('protocol');

    // Simulate network delay and processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(`[SOAR] Executing ${protocol} on Incident ${id}`);

    // In a real app, this would call backend services
    return {
        success: true,
        message: `Successfully executed ${protocol}`,
        timestamp: new Date().toISOString()
    };
}
