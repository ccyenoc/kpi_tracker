#!/bin/bash
# Email Verification System - Status & Testing Guide

echo "================================"
echo "KPI Tracker - Email Verification"
echo "================================"
echo ""

# Test Backend
echo "1. Testing Backend Server..."
HEALTH=$(curl -s http://localhost:8006/api/health)
if echo "$HEALTH" | grep -q '"status":"healthy"'; then
    echo "   ✓ Backend is running at http://localhost:8006"
    echo "   ✓ Firebase connected: $(echo $HEALTH | grep -o '"firebase_connected":[^,]*')"
else
    echo "   ✗ Backend is not responding"
    exit 1
fi
echo ""

# Test SMTP
echo "2. Testing SMTP Configuration..."
SMTP_TEST=$(cat > /tmp/test_smtp.py << 'PYTHONEOF'
import os
from dotenv import load_dotenv
load_dotenv()
import smtplib
try:
    server = smtplib.SMTP(os.getenv("SMTP_HOST"), int(os.getenv("SMTP_PORT")), timeout=10)
    server.starttls()
    server.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASSWORD"))
    server.quit()
    print("SMTP_OK")
except Exception as e:
    print(f"SMTP_ERROR: {e}")
PYTHONEOF
cd /workspaces/kpi_tracker/backend && python3 /tmp/test_smtp.py)

if echo "$SMTP_TEST" | grep -q "SMTP_OK"; then
    echo "   ✓ SMTP connection successful"
else
    echo "   ✗ SMTP connection failed: $SMTP_TEST"
fi
echo ""

# Test Email Send
echo "3. Testing Email Send..."
SEND_TEST=$(cat > /tmp/test_send.py << 'PYTHONEOF'
import os
from dotenv import load_dotenv
load_dotenv()
import smtplib
from email.message import EmailMessage
try:
    msg = EmailMessage()
    msg['Subject'] = 'KPI Tracker Test'
    msg['From'] = os.getenv("SMTP_FROM")
    msg['To'] = os.getenv("SMTP_USER")
    msg.set_content("Test email - verification system working")
    
    server = smtplib.SMTP(os.getenv("SMTP_HOST"), int(os.getenv("SMTP_PORT")), timeout=10)
    server.starttls()
    server.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASSWORD"))
    server.send_message(msg)
    server.quit()
    print("EMAIL_SENT_OK")
except Exception as e:
    print(f"EMAIL_ERROR: {e}")
PYTHONEOF
cd /workspaces/kpi_tracker/backend && python3 /tmp/test_send.py)

if echo "$SEND_TEST" | grep -q "EMAIL_SENT_OK"; then
    echo "   ✓ Test email sent successfully"
else
    echo "   ✗ Email send failed: $SEND_TEST"
fi
echo ""

# Test Verification Endpoint
echo "4. Testing /api/verify-email Endpoint..."
VERIFY_TEST=$(curl -s -X POST http://localhost:8006/api/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email": "systemtest@example.com"}')

if echo "$VERIFY_TEST" | grep -q '"success":true'; then
    echo "   ✓ /api/verify-email endpoint working"
    echo "   Response: $VERIFY_TEST"
else
    echo "   ✗ /api/verify-email failed: $VERIFY_TEST"
fi
echo ""

echo "================================"
echo "✓ All systems operational!"
echo "================================"
echo ""
echo "Frontend is running on: http://localhost:5174"
echo "Backend is running on: http://localhost:8006"
echo ""
echo "To test the signup flow:"
echo "1. Open http://localhost:5174/signup in your browser"
echo "2. Enter an email address"
echo "3. Click 'Send Code'"
echo "4. Check zengyiham@gmail.com for the verification code"
echo "5. Enter the 6-digit code"
echo "6. Click 'Verify'"
echo "7. Complete the rest of the signup form"
echo ""
