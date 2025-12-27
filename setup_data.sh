#!/bin/bash

BASE_URL="http://localhost:8000/api"
ORGANIZER_EMAIL="organizer@gmail.com"
ORGANIZER_PASSWORD="password123"
ATTENDEE_EMAIL="attendee@gmail.com"
ATTENDEE_PASSWORD="password123"

# --- 0. RESET DATABASE ---
echo "Resetting Database..."
docker compose exec backend python reset_db.py
if [ $? -ne 0 ]; then
    echo "Failed to reset database using docker logic. Please ensure docker is running."
    exit 1
fi
echo "Database reset complete."

# --- HELPER: LOGIN ---
login() {
  local email=$1
  local password=$2
  local role=$3
  
  echo "Creating User $email (ignoring if exists)..." >&2
  curl -s -X POST "$BASE_URL/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "'"$email"'",
      "password": "'"$password"'",
      "full_name": "'"$role"' User",
      "role": "'"$role"'"
    }' > /dev/null
  
  echo "Logging in as $role..." >&2
  RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$email&password=$password")

  TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  if [ -z "$TOKEN" ]; then
    echo "Login failed for $email. Response: $RESPONSE" >&2
    exit 1
  fi
  echo $TOKEN
}

# --- 1. SETUP ORGANIZER ---
ORG_TOKEN=$(login "$ORGANIZER_EMAIL" "$ORGANIZER_PASSWORD" "ORGANIZER")
echo "Organizer Token: ${ORG_TOKEN:0:10}..."

# --- 2. CREATE EVENTS ---
echo -e "\nCreating Events..."

create_event_url() {
  local title=$1
  local date=$2
  local location=$3
  local price=$4
  local seats=$5
  local type=$6
  local image_url=$7
  local desc=$8

  curl -X POST "$BASE_URL/events/" \
    -H "Authorization: Bearer $ORG_TOKEN" \
    -F "title=$title" \
    -F "date=$date" \
    -F "location=$location" \
    -F "price=$price" \
    -F "total_seats=$seats" \
    -F "event_type=$type" \
    -F "status=PUBLISHED" \
    -F "image_url=$image_url" \
    -F "description=$desc" \
    > /dev/null 2>&1
    
  echo "Created: $title (Image: URL)"
}

# Using image URLs
create_event_url "Neon Dreams Concert" "2025-06-15T20:00:00" "Cyber Arena" 120.00 500 "CONCERT" "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500" "Synthwave night."
create_event_url "Future Tech Conf" "2025-07-10T09:00:00" "Innovation Center" 500.00 1000 "CONFERENCE" "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500" "AI and Blockchain."
create_event_url "Digital Art Workshop" "2025-05-20T14:00:00" "Creative Hub" 80.00 30 "WORKSHOP" "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500" "Learn digital painting."
create_event_url "Symphony Under Stars" "2025-08-05T19:30:00" "City Park" 150.00 2000 "CONCERT" "https://images.unsplash.com/photo-1465847899078-b413929f7120?w=500" "Classical music outdoors."
create_event_url "Shakespeare in Park" "2025-09-12T18:00:00" "Globe Outdoor" 45.00 300 "THEATER" "https://images.unsplash.com/photo-1507676184212-d03816b98fce?w=500" "Hamlet performance."

# Reuse images for more events
create_event_url "React Summit" "2025-10-01T09:00:00" "Convention Hall" 300.00 800 "CONFERENCE" "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=500" "Frontend development."
create_event_url "Pottery Masterclass" "2025-04-15T10:00:00" "Art Studio" 60.00 15 "WORKSHOP" "https://images.unsplash.com/photo-1565193566173-092928ae6e89?w=500" "Hands-on clay work."
create_event_url "Indie Film Premiere" "2025-11-20T20:00:00" "Vintage Cinema" 25.00 100 "THEATER" "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500" "Local filmmaker showcase."
create_event_url "Jazz & Blues Night" "2025-06-30T21:00:00" "Blue Note Club" 90.00 150 "CONCERT" "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500" "Smooth jazz evening."
create_event_url "Startup Pitch" "2025-05-05T18:00:00" "WeWork Space" 10.00 50 "OTHER" "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500" "Pitch your idea."

# --- 3. SETUP ATTENDEE & BOOK ---
echo -e "\n3. Attendee Booking..."
ATT_TOKEN=$(login "$ATTENDEE_EMAIL" "$ATTENDEE_PASSWORD" "ATTENDEE")

# Get IDs of first 3 events
EVENTS=$(curl -s "$BASE_URL/events/" -H "Authorization: Bearer $ATT_TOKEN" | grep -o '"id":[0-9]*' | head -3 | cut -d':' -f2)

for id in $EVENTS; do
  echo "Booking Event ID: $id"
  curl -s -X POST "$BASE_URL/bookings/" \
    -H "Authorization: Bearer $ATT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"event_id": '"$id"'}' > /dev/null
done

echo -e "\nDone! Database populated with image URLs."
