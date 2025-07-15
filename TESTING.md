# DealBrief Scanner - Comprehensive Testing Suite

## Overview

This document outlines the comprehensive unit testing suite built for the DealBrief security scanner. The tests are designed to validate all workers, modules, and reports using **real external APIs** for maximum authenticity.

## 🎯 Test Coverage

### ✅ Completed Components

#### Core Workers (4/4)
- **Main Worker** (`worker.ts`) - Orchestration and module execution
- **Sync Worker** (`sync.ts`) - Database synchronization between Fly.io and Supabase  
- **ZAP Worker** (`zapWorker.ts`) - Dedicated OWASP ZAP scanning
- **NVD Worker** (`nvd-mirror-worker.ts`) - CVE database mirroring

#### Core Infrastructure (4/4)
- **Artifact Store** (`artifactStore.ts`) - Data persistence and finding storage
- **Queue System** (`queue.ts`) - Redis-based job management with Upstash
- **Logger** (`logger.ts`) - Structured logging with configurable levels
- **Security Wrapper** (`securityWrapper.ts`) - Unified scanner execution interface

#### Key Security Modules (3/30+)
- **Shodan Scanner** (`shodan.ts`) - Network reconnaissance and vulnerability detection
- **Nuclei Scanner** (`nuclei.ts`) - Vulnerability template engine with CVE verification
- **ZAP Scanner** (`zapScan.ts`) - Web application security testing

### 🚧 Pending Components
- **Utility Modules** (browser, captcha, error handling, etc.)
- **Report Generators** (Supabase functions)
- **Frontend Components** (React report components)
- **Integration Tests** (end-to-end with live vulnerable site)

## 🏗️ Test Infrastructure

### Configuration
```bash
# Test framework: Vitest
# Test environment: Node.js with real API integration
# Mock strategy: Selective mocking (preserve API calls)
```

### Key Features
- **Real API Testing**: Uses actual external APIs (Shodan, Nuclei, etc.)
- **Rate Limiting**: Built-in delays to respect API limits
- **Environment Validation**: Skips tests when API keys missing
- **Comprehensive Mocking**: Strategic mocks for filesystem, process management
- **Error Resilience**: Tests handle failures gracefully

## 🚀 Running Tests

### Prerequisites
Set up environment variables for real API testing:

```bash
# Required for full test coverage
export SHODAN_API_KEY="your-shodan-api-key"
export OPENAI_API_KEY="your-openai-api-key"
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export REDIS_URL="your-redis-url"
export DATABASE_URL="your-postgres-url"

# Optional test configuration
export LOG_LEVEL="DEBUG"
export NODE_ENV="test"
```

### Test Commands

```bash
# Navigate to workers directory
cd apps/workers

# Run all tests
npm run test

# Run specific test suites
npm run test:run tests/setup.test.ts                    # Verify test setup
npm run test:run tests/core/                           # Core infrastructure
npm run test:run tests/modules/                        # Security modules  
npm run test:run tests/worker.test.ts                  # Main worker

# Run with coverage
npm run test -- --coverage

# Run in watch mode during development
npm run test:watch
```

## 📊 Test Structure

### Core Worker Tests
```
tests/
├── worker.test.ts           # Main orchestration worker
├── sync-worker.test.ts      # Database synchronization  
├── zap-worker.test.ts       # ZAP dedicated worker
└── nvd-worker.test.ts       # NVD mirror worker
```

### Infrastructure Tests
```
tests/core/
├── artifactStore.test.ts    # Database operations
├── queue.test.ts           # Redis job management
├── logger.test.ts          # Logging infrastructure
└── securityWrapper.test.ts  # Scanner execution wrapper
```

### Security Module Tests
```
tests/modules/
├── shodan.test.ts          # Network reconnaissance
├── nuclei.test.ts          # Vulnerability templates
└── zapScan.test.ts         # Web application security
```

### Utilities and Helpers
```
tests/helpers/
└── testUtils.ts            # Shared test utilities and constants
```

## 🎯 Test Target

All tests are designed to work against the live vulnerable test site:
- **Target**: `https://vulnerable-test-site.vercel.app`
- **Purpose**: Provides real vulnerabilities for testing scanner effectiveness
- **Safety**: Explicitly designed for security testing

## 🔍 Test Scenarios

### Real API Integration
- **Shodan**: Live IP/domain reconnaissance against test site
- **Nuclei**: Template execution against vulnerable endpoints  
- **ZAP**: Web application scanning of test site
- **Database**: Real connections to test databases

### Error Handling
- **Network failures**: Timeout and connectivity issues
- **Rate limiting**: API quota and throttling
- **Malformed data**: Invalid JSON, missing fields
- **Resource limits**: Memory, concurrency, file system

### Performance Testing
- **Concurrency**: Multiple simultaneous scans
- **Large datasets**: Bulk processing capabilities
- **Memory usage**: Resource consumption monitoring
- **Rate limiting**: API compliance verification

## 📈 Success Metrics

### Coverage Targets
- **Critical paths**: 90%+ coverage
- **Overall coverage**: 70%+ coverage
- **Real API validation**: 100% of external integrations tested

### Quality Gates
- All tests must pass with real API keys
- No security vulnerabilities in test code
- Proper cleanup of test resources
- Documented failure scenarios

## 🛠️ Development Workflow

### Adding New Tests
1. Create test file following naming convention: `*.test.ts`
2. Import shared utilities from `testUtils.ts`
3. Use real APIs where possible, mock only infrastructure
4. Include both success and failure scenarios
5. Add rate limiting for external API calls

### Test Maintenance
- Update tests when modules change
- Refresh API credentials as needed
- Monitor test execution times
- Review coverage reports regularly

## 🔒 Security Considerations

### Safe Testing Practices
- Only test against designated vulnerable site
- Never test unauthorized targets
- Respect API rate limits and quotas
- Clean up test data after execution
- No sensitive data in test files

### API Key Management
- Use environment variables only
- Never commit credentials to repository
- Rotate keys regularly
- Use minimal permissions for test accounts

## 📋 Next Steps

To complete the full testing suite:

1. **Expand Module Coverage**: Add tests for remaining 27+ security modules
2. **Utility Testing**: Test browser automation, captcha solving, error handling
3. **Report Testing**: Validate Supabase functions and frontend components  
4. **Integration Testing**: Full end-to-end workflow validation
5. **Performance Testing**: Load testing and scaling validation

## 🆘 Troubleshooting

### Common Issues
- **Missing API keys**: Tests will be skipped, check environment variables
- **Rate limiting**: Increase delays in `withRateLimit()` calls
- **Database connection**: Verify DATABASE_URL and permissions
- **Redis connection**: Check REDIS_URL format and accessibility

### Test Failures
- Review test logs for specific error details
- Verify external service availability 
- Check API key permissions and quotas
- Ensure test environment isolation

---

**Ready to execute comprehensive security scanner testing with real-world API validation!** 🛡️