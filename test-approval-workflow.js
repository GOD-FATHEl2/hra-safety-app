// Test script to submit a bedömning and trigger notifications
async function testApprovalWorkflow() {
    console.log('🧪 Testing Approval Workflow');
    
    // First, let's log in as a regular user
    const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'erik.larsson',
            password: 'erik123'
        })
    });
    
    if (!loginResponse.ok) {
        console.log('❌ Login failed');
        return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Logged in as:', loginData.name);
    
    // Submit a high-risk assessment that requires approval
    const assessmentData = {
        date: new Date().toISOString().split('T')[0],
        worker_name: 'Erik Larsson',
        team: 'Electrical Maintenance',
        location: 'Production Line 1',
        task: 'High voltage electrical work',
        risk_s: 5,  // High severity
        risk_k: 3,  // Medium probability = 15 risk score (>= 10 requires approval)
        risks: 'Electrical shock, arc flash',
        checklist: ['Ja', 'Ja', 'Nej', 'Ja', 'Ja'], // Contains "Nej" = requires approval
        actions: 'Use proper PPE, lockout tagout procedures',
        further: 'Nej',
        fullrisk: 'Nej',
        safe: 'Nej', // Requires approval
        leader: '',
        signature: '',
        images: []
    };
    
    const submitResponse = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + loginData.token
        },
        body: JSON.stringify(assessmentData)
    });
    
    if (submitResponse.ok) {
        const result = await submitResponse.json();
        console.log('✅ Assessment submitted:', result);
        console.log('📧 Notifications should be sent to all Arbetsledare');
        
        // Now let's check notifications as a team leader
        console.log('🔄 Switching to team leader account...');
        
        const teamLeaderLogin = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'workleader.day',
                password: 'day123'
            })
        });
        
        if (teamLeaderLogin.ok) {
            const teamLeaderData = await teamLeaderLogin.json();
            console.log('✅ Logged in as team leader:', teamLeaderData.name);
            
            // Check notifications
            const notificationsResponse = await fetch('/api/notifications', {
                headers: { 'Authorization': 'Bearer ' + teamLeaderData.token }
            });
            
            if (notificationsResponse.ok) {
                const notifications = await notificationsResponse.json();
                console.log('📬 Team leader notifications:', notifications);
                
                const pendingNotifications = notifications.filter(n => n.type === 'assessment_pending');
                console.log(`📋 ${pendingNotifications.length} pending assessments for approval`);
            }
        }
    } else {
        const error = await submitResponse.json();
        console.log('❌ Assessment submission failed:', error);
    }
}

// Run the test
testApprovalWorkflow().catch(console.error);