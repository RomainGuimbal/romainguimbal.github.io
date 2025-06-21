export async function fetchCollectiveBalance(slug) {
    const query = `
        query GetCollective($slug: String!) {
            collective(slug: $slug) {
                name
                stats {
                    balance {
                        valueInCents
                        currency
                    }
                }
            }
        }
    `;
    
    try {
        const response = await fetch('https://api.opencollective.com/graphql/v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: { slug: slug }
            })
        });
        
        const data = await response.json();
        
        if (data.errors) {
            throw new Error(data.errors[0].message);
        }
        
        const collective = data.data.collective;
        const balance = collective.stats.balance;
        const amount = (balance.valueInCents / 100).toFixed(2);
        
        // Update your HTML elements
        document.getElementById('balance-amount').textContent = 
            amount; // Only set the amount, not the currency code
        if (document.getElementById('collective-name')) {
            document.getElementById('collective-name').textContent = 
                collective.name;
        }
            
        return { amount, currency: balance.currency, name: collective.name };
    } catch (error) {
        console.error('Error fetching balance:', error);
        return null;
    }
}

