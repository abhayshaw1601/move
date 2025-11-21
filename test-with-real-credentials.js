#!/usr/bin/env node

/**
 * ProvenancePro CLI - Real Blockchain Integration Test Suite
 * 
 * Tests all CLI functions with real Sui credentials and minimal SUI amounts
 * Uses actual blockchain interactions for comprehensive validation
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
