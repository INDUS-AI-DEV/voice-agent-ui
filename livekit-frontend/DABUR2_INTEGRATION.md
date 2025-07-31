# Dabur2 Integration Documentation

## Overview

This project now includes a new Dabur2 WebCall page that integrates with the Dabur2 token API, providing a comprehensive form for collecting hierarchical employee information and managing video calls.

## Features

### Dabur2 Token API Integration
- **Endpoint**: `/api/token/dabur2`
- **Required Parameters**: `room`, `user`, `language`, `UserPhone`
- **Optional Hierarchical Parameters**: Employee information and management hierarchy (RSM, ASM, BA Supervisor, KAM)

### WebCall Page Features
- **Modern UI**: Clean, responsive design with great user experience
- **Form Validation**: Required field validation with clear error messages
- **Hierarchical Data Collection**: Collapsible sections for optional employee hierarchy
- **Language Selection**: Support for multiple languages (Hindi, English, Tamil, Arabic, African)
- **Real-time Chat**: Live chat interface during calls
- **Call Management**: Start/end call functionality with visual indicators

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the `livekit-frontend` directory with the following variables:

```env
# LiveKit Configuration
REACT_APP_LIVEKIT_WS_URL=wss://your-livekit-server.com
REACT_APP_TOKEN_SERVER_URL=http://localhost:3000/api/token/

# LiveKit API Keys (for backend token generation)
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here

# Backend API URL (if using separate backend)
REACT_APP_BACKEND_URL=http://localhost:8000
```

### 2. API Endpoint Configuration

The Dabur2 token API is implemented in `api/token.js` and supports:

#### Required Parameters
- `room`: Video room identifier
- `user`: User identifier (used as LiveKit identity AND encoded in metadata)
- `language`: Language preference (encoded in metadata)
- `UserPhone`: User's phone number (encoded in metadata)

#### Optional Hierarchical Parameters
- **Employee Information**: `EmpId`, `EmployeeName`, `EmpPhone`
- **RSM (Regional Sales Manager)**: `RSMId`, `RSMName`, `RSMPhone`
- **ASM (Area Sales Manager)**: `ASMId`, `ASMName`, `ASMPhone`
- **BA Supervisor**: `BASupervisorId`, `BASupervisorName`, `BASupervisorPhone`
- **KAM (Key Account Manager)**: `KAMId`, `KAMName`, `KAMPhone`

### 3. Running the Application

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

## Usage

### Navigation
The application now has two main pages:
1. **Classic Call** (`/`) - Original call interface
2. **Dabur2 WebCall** (`/webcall`) - New Dabur2 integration

### Dabur2 WebCall Workflow

1. **Authentication**: Enter 4-digit MPIN to access the system
2. **Language Selection**: Choose preferred language from dropdown
3. **Required Information**: Fill in Client Name and User Phone (required)
4. **Optional Hierarchy**: Click "Show Hierarchy Fields" to add employee and management information
5. **Start Call**: Click "START CALL" to connect to the agent
6. **Live Chat**: Monitor real-time chat messages during the call
7. **End Call**: Click "END CALL" to disconnect

### API Examples

#### Minimal Request
```
GET /api/token/dabur2?room=room123&user=john&language=en&UserPhone=9876543210
```

#### Full Request with Hierarchy
```
GET /api/token/dabur2?room=room123&user=john&language=en&UserPhone=9876543210&EmpId=30313&EmployeeName=Vacant%20Indrajeet&EmpPhone=1511202113&RSMId=5226&RSMName=PRASHANT&RSMPhone=9818703111&KAMId=30313&KAMName=Vacant%20Indrajeet&KAMPhone=1511202113
```

## Response Structure

The API returns a JWT token with metadata containing all provided information:

```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Token Metadata Example
```json
{
  "language": "en",
  "user": "john",
  "UserPhone": "9876543210",
  "EmpId": 30313,
  "EmployeeName": "Vacant Indrajeet",
  "EmpPhone": "1511202113",
  "RSMId": "5226",
  "RSMName": "PRASHANT",
  "RSMPhone": "9818703111",
  "ASMId": null,
  "ASMName": null,
  "ASMPhone": null,
  "BASupervisorId": null,
  "BASupervisorName": null,
  "BASupervisorPhone": null,
  "KAMId": "30313",
  "KAMName": "Vacant Indrajeet",
  "KAMPhone": "1511202113"
}
```

## UI/UX Features

### Responsive Design
- Mobile-friendly interface
- Adaptive grid layouts
- Touch-optimized controls

### Visual Feedback
- Loading spinners during connection
- Speaking indicators
- Call status updates
- Form validation feedback

### Accessibility
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast color schemes
- Clear visual hierarchy

## Error Handling

- **Form Validation**: Required field validation with clear error messages
- **Network Errors**: Graceful handling of connection failures
- **API Errors**: User-friendly error messages for API failures
- **Token Errors**: Proper error handling for invalid tokens

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check LiveKit server URL and API keys
2. **Token Generation Error**: Verify required parameters are provided
3. **Audio Issues**: Ensure microphone permissions are granted
4. **Form Not Submitting**: Check required field validation

### Debug Mode

Enable browser developer tools to see detailed console logs for debugging connection and API issues.

## Security Considerations

- MPIN authentication required for access
- Secure token generation with proper validation
- Input sanitization for all form fields
- HTTPS recommended for production deployment

## Future Enhancements

- Multi-language support for UI elements
- Advanced call analytics
- Integration with CRM systems
- Enhanced reporting features
- Mobile app development 