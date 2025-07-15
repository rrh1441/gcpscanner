#!/usr/bin/env node

console.log('🔍 Example Remediation Results from Scan: hu-TUdbc_N1');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Mock remediation data based on the expected structure
const mockFindings = [
  {
    severity: 'CRITICAL',
    finding_type: 'outdated_software',
    val_text: 'Apache/2.4.41 (Ubuntu)',
    description: 'Outdated Apache web server version detected with known vulnerabilities',
    recommendation: 'Update Apache to the latest stable version to patch security vulnerabilities',
    src_url: 'https://example-test-company.com',
    remediation: {
      summary: 'Update Apache web server to version 2.4.58 or later to address multiple security vulnerabilities including CVE-2023-25690 and CVE-2023-27522.',
      steps: [
        'Create a backup of your current Apache configuration',
        'Update the package repository index',
        'Upgrade Apache to the latest version',
        'Verify the new version is installed',
        'Test your web applications for compatibility',
        'Monitor logs for any issues'
      ],
      code_example: {
        language: 'bash',
        code: `# Backup configuration
sudo cp -r /etc/apache2 /etc/apache2.backup

# Update and upgrade Apache
sudo apt update
sudo apt upgrade apache2

# Verify new version
apache2 -v

# Restart Apache
sudo systemctl restart apache2
sudo systemctl status apache2`
      },
      verification_command: 'apache2 -v | grep -E "Apache/2.4.(5[8-9]|[6-9][0-9])"'
    }
  },
  {
    severity: 'HIGH',
    finding_type: 'ssl_vulnerability',
    val_text: 'TLS 1.0 and TLS 1.1 enabled',
    description: 'Outdated TLS protocols are enabled which are vulnerable to various attacks',
    recommendation: 'Disable TLS 1.0 and TLS 1.1, only allow TLS 1.2 and TLS 1.3',
    src_url: 'https://example-test-company.com:443',
    remediation: {
      summary: 'Disable outdated TLS protocols (1.0 and 1.1) and configure the server to only accept TLS 1.2 and TLS 1.3 connections.',
      steps: [
        'Locate your SSL/TLS configuration file',
        'Update the SSL protocol settings',
        'Remove weak cipher suites',
        'Test the configuration',
        'Reload the web server',
        'Verify the changes with an SSL test'
      ],
      code_example: {
        language: 'apache',
        code: `# In your Apache SSL configuration
SSLProtocol -all +TLSv1.2 +TLSv1.3
SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
SSLHonorCipherOrder on

# For Nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers on;`
      },
      verification_command: 'nmap --script ssl-enum-ciphers -p 443 example-test-company.com | grep "TLSv1.[01]"'
    }
  },
  {
    severity: 'HIGH',
    finding_type: 'exposed_database',
    val_text: 'PostgreSQL on port 5432',
    description: 'Database service is publicly accessible from the internet',
    recommendation: 'Restrict database access to only trusted IP addresses using firewall rules',
    src_url: 'example-test-company.com:5432',
    remediation: {
      summary: 'Configure firewall rules to restrict PostgreSQL access to only authorized IP addresses and implement SSL/TLS encryption for database connections.',
      steps: [
        'Identify all legitimate clients that need database access',
        'Configure firewall rules to allow only specific IPs',
        'Enable SSL/TLS for PostgreSQL connections',
        'Update pg_hba.conf to require SSL',
        'Consider using a VPN or SSH tunnel for remote access',
        'Implement connection pooling and rate limiting'
      ],
      code_example: {
        language: 'bash',
        code: `# Using iptables to restrict access
sudo iptables -A INPUT -p tcp --dport 5432 -s 10.0.0.0/24 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5432 -s 192.168.1.100 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5432 -j DROP

# Configure PostgreSQL for SSL
# In postgresql.conf:
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'

# In pg_hba.conf:
hostssl all all 10.0.0.0/24 md5
hostssl all all 192.168.1.100/32 md5`
      },
      verification_command: 'nmap -p 5432 example-test-company.com'
    }
  },
  {
    severity: 'MEDIUM',
    finding_type: 'missing_security_headers',
    val_text: 'Missing X-Frame-Options header',
    description: 'Security headers are not properly configured, making the site vulnerable to clickjacking',
    recommendation: 'Implement security headers including X-Frame-Options, X-Content-Type-Options, and CSP',
    src_url: 'https://example-test-company.com',
    remediation: {
      summary: 'Add security headers to protect against common web vulnerabilities including clickjacking, XSS, and content type sniffing.',
      steps: [
        'Add X-Frame-Options header to prevent clickjacking',
        'Add X-Content-Type-Options to prevent MIME sniffing',
        'Implement Content Security Policy (CSP)',
        'Add Strict-Transport-Security for HTTPS',
        'Configure Referrer-Policy',
        'Test headers with online security tools'
      ],
      code_example: {
        language: 'apache',
        code: `# Apache configuration
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"

# Nginx configuration
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;`
      },
      verification_command: 'curl -I https://example-test-company.com | grep -E "X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security"'
    }
  },
  {
    severity: 'MEDIUM',
    finding_type: 'weak_password_policy',
    val_text: 'WordPress admin login allows weak passwords',
    description: 'The application does not enforce strong password requirements',
    recommendation: 'Implement strong password policy requiring minimum length, complexity, and regular rotation',
    src_url: 'https://example-test-company.com/wp-admin',
    remediation: {
      summary: 'Implement a strong password policy for WordPress requiring minimum 12 characters, mixed case, numbers, special characters, and enable two-factor authentication.',
      steps: [
        'Install a password policy plugin or implement custom requirements',
        'Set minimum password length to 12 characters',
        'Require mixed case, numbers, and special characters',
        'Implement password history to prevent reuse',
        'Enable two-factor authentication',
        'Force password reset for all existing users'
      ],
      code_example: {
        language: 'php',
        code: `// Add to functions.php or custom plugin
add_filter('wpseo_password_strength_check', 'enforce_strong_passwords');
function enforce_strong_passwords($strength) {
    $password = $_POST['pass1'];
    
    // Check minimum length
    if (strlen($password) < 12) {
        return new WP_Error('weak_password', 'Password must be at least 12 characters long.');
    }
    
    // Check for uppercase, lowercase, numbers, and special characters
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]/', $password)) {
        return new WP_Error('weak_password', 'Password must contain uppercase, lowercase, numbers, and special characters.');
    }
    
    return $strength;
}

// Install and configure a 2FA plugin
// Recommended: WP 2FA or Google Authenticator`
      },
      verification_command: 'wp user list --role=administrator --format=table'
    }
  }
];

// Display the findings
console.log(`📊 Found ${mockFindings.length} findings with remediation data\n`);

mockFindings.forEach((finding, index) => {
  console.log(`${index + 1}. [${finding.severity}] ${finding.finding_type}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log(`📍 Finding: ${finding.val_text}`);
  console.log(`📝 Description: ${finding.description}`);
  console.log(`⚠️  Recommendation: ${finding.recommendation}`);
  console.log(`🔗 Source: ${finding.src_url}`);
  
  console.log('\n✅ REMEDIATION DETAILS:');
  console.log('───────────────────────');
  
  const remediation = finding.remediation;
  
  console.log(`📋 Summary: ${remediation.summary}\n`);
  
  console.log('📌 Steps:');
  remediation.steps.forEach((step, idx) => {
    console.log(`   ${idx + 1}. ${step}`);
  });
  console.log('');
  
  console.log(`💻 Code Example (${remediation.code_example.language}):`);
  console.log('```' + remediation.code_example.language);
  console.log(remediation.code_example.code);
  console.log('```\n');
  
  console.log(`🔍 Verification Command:`);
  console.log(`   ${remediation.verification_command}`);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// Summary
const severityCounts = {
  CRITICAL: mockFindings.filter(f => f.severity === 'CRITICAL').length,
  HIGH: mockFindings.filter(f => f.severity === 'HIGH').length,
  MEDIUM: mockFindings.filter(f => f.severity === 'MEDIUM').length,
  LOW: mockFindings.filter(f => f.severity === 'LOW').length
};

console.log('📊 REMEDIATION SUMMARY:');
console.log('───────────────────────');
Object.entries(severityCounts).forEach(([severity, count]) => {
  if (count > 0) {
    console.log(`   ${severity}: ${count} findings with remediation`);
  }
});

console.log('\n💡 Note: This is example data showing what remediation results would look like.');
console.log('   In a real scan, this data would be generated by AI based on the actual findings.');