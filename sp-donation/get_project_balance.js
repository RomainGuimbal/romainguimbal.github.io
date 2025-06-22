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
        // Round to nearest euro (no decimals)
        const amount = Math.round(balance.valueInCents / 100);

        // Format with space as thousands separator (fr-FR)
        const formattedAmount = amount.toLocaleString('fr-FR');

        // Update your HTML elements
        document.getElementById('balance-amount').textContent =
            formattedAmount + ' €'; // Add euro symbol
        if (document.getElementById('collective-name')) {
            document.getElementById('collective-name').textContent =
                collective.name;
        }

        return { amount, formattedAmount, currency: balance.currency, name: collective.name };
    } catch (error) {
        console.error('Error fetching balance:', error);
        return null;
    }
}

