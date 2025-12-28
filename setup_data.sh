#!/bin/bash

BASE_URL="http://localhost:8000/api"
ORGANIZER_EMAIL="organizer@gmail.com"
ORGANIZER_PASSWORD="password123"
ORGANIZER2_EMAIL="organizer2@gmail.com"
ORGANIZER2_PASSWORD="password123"
ATTENDEE_EMAIL="attendee@gmail.com"
ATTENDEE_PASSWORD="password123"
ATTENDEE2_EMAIL="attendee2@gmail.com"
ATTENDEE2_PASSWORD="password123"

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
  local interests=${4:-"[]"}
  
  echo "Creating User $email (ignoring if exists)..." >&2
  curl -s -X POST "$BASE_URL/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "'"$email"'",
      "password": "'"$password"'",
      "full_name": "'"$role"' User",
      "role": "'"$role"'",
      "interests": '"$interests"'
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
ORG2_TOKEN=$(login "$ORGANIZER2_EMAIL" "$ORGANIZER2_PASSWORD" "ORGANIZER")
echo "Organizer Token: ${ORG_TOKEN:0:10}..."
echo "Organizer 2 Token: ${ORG2_TOKEN:0:10}..."

# --- 2. CREATE EVENTS ---
echo -e "\nCreating Events..."

create_event_url() {
  local title=$1
  local date=$2
  local end_date=$3
  local location=$4
  local price=$5
  local seats=$6
  local type=$7
  local image_url=$8
  local desc=$9

  curl -X POST "$BASE_URL/events/" \
    -H "Authorization: Bearer $ORG_TOKEN" \
    -F "title=$title" \
    -F "date=$date" \
    -F "end_date=$end_date" \
    -F "location=$location" \
    -F "price=$price" \
    -F "total_seats=$seats" \
    -F "event_type=$type" \
    -F "status=${10:-PUBLISHED}" \
    -F "image_url=$image_url" \
    -F "description=$desc" \
    > /dev/null 2>&1
    
  echo "Created: $title (Image: URL)"
}

# Using image URLs
create_event_url "Neon Dreams Concert" "2026-06-15T20:00:00" "2026-06-15T23:00:00" "Cyber Arena" 120.00 500 "CONCERT" "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500" "Synthwave night."
create_event_url "Future Tech Conf" "2026-07-10T09:00:00" "2026-07-10T17:00:00" "Innovation Center" 500.00 1000 "CONFERENCE" "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500" "AI and Blockchain."
create_event_url "Digital Art Workshop" "2026-05-20T14:00:00" "2026-05-20T16:00:00" "Creative Hub" 80.00 30 "WORKSHOP" "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500" "Learn digital painting."
create_event_url "Symphony Under Stars" "2026-08-05T19:30:00" "2026-08-05T21:30:00" "City Park" 150.00 2000 "CONCERT" "https://images.unsplash.com/photo-1551696785-927d4ac2d35b?w=500" "Classical music outdoors."
create_event_url "Shakespeare in Park" "2026-09-12T18:00:00" "2026-09-12T21:00:00" "Globe Outdoor" 45.00 300 "THEATER" "https://plus.unsplash.com/premium_photo-1664302637848-6ae0d5821944?w=500" "Hamlet performance."

# Reuse images for more events
create_event_url "React Summit" "2026-10-01T09:00:00" "2026-10-01T18:00:00" "Convention Hall" 300.00 800 "CONFERENCE" "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=500" "Frontend development."
create_event_url "Pottery Masterclass" "2026-04-15T10:00:00" "2026-04-15T12:00:00" "Art Studio" 60.00 15 "WORKSHOP" "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=500" "Hands-on clay work."
create_event_url "Indie Film Premiere" "2026-11-20T20:00:00" "2026-11-20T22:30:00" "Vintage Cinema" 25.00 100 "THEATER" "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=500" "Local filmmaker showcase."
create_event_url "Jazz & Blues Night" "2026-06-30T21:00:00" "2026-06-30T23:30:00" "Blue Note Club" 90.00 150 "CONCERT" "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=500" "Smooth jazz evening."
create_event_url "Startup Pitch" "2026-05-05T18:00:00" "2026-05-05T20:00:00" "WeWork Space" 10.00 50 "OTHER" "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500" "Pitch your idea." "DRAFT"

create_event_url_org2() {
  local title=$1
  local date=$2
  local end_date=$3
  local location=$4
  local price=$5
  local seats=$6
  local type=$7
  local image_url=$8
  local desc=$9

  curl -X POST "$BASE_URL/events/" \
    -H "Authorization: Bearer $ORG2_TOKEN" \
    -F "title=$title" \
    -F "date=$date" \
    -F "end_date=$end_date" \
    -F "location=$location" \
    -F "price=$price" \
    -F "total_seats=$seats" \
    -F "event_type=$type" \
    -F "status=PUBLISHED" \
    -F "image_url=$image_url" \
    -F "description=$desc" \
    > /dev/null 2>&1
    
  echo "Created (Org 2): $title"
}

create_event_url_org2 "Modern Dance Show" "2026-07-20T19:00:00" "2026-07-20T21:00:00" "City Arts Theater" 55.00 200 "THEATER" "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=500" "Contemporary dance performance."
create_event_url_org2 "Blockchain Summit" "2026-09-05T09:00:00" "2026-09-05T17:00:00" "Grand Hotel" 400.00 500 "CONFERENCE" "https://images.unsplash.com/photo-1605792657660-596af9009e82?w=500" "Everything about crypto."

# --- 3. SETUP ATTENDEE & BOOK ---
echo -e "\n3. Attendee Booking..."
ATT_TOKEN=$(login "$ATTENDEE_EMAIL" "$ATTENDEE_PASSWORD" "ATTENDEE" '["Music", "Technology"]')

# Get IDs of first 3 events
EVENTS=$(curl -s "$BASE_URL/events/" -H "Authorization: Bearer $ATT_TOKEN" | grep -o '"id":[0-9]*' | head -3 | cut -d':' -f2)

for id in $EVENTS; do
  echo "Booking Event ID: $id"
  curl -s -X POST "$BASE_URL/bookings/" \
    -H "Authorization: Bearer $ATT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"event_id": '"$id"'}' > /dev/null
done

echo -e "\n3b. Attendee 2 Booking..."
ATT2_TOKEN=$(login "$ATTENDEE2_EMAIL" "$ATTENDEE2_PASSWORD" "ATTENDEE" '["WORKSHOP", "Art", "Theater"]')
# Get IDs of next 2 events (offset 3)
EVENTS2=$(curl -s "$BASE_URL/events/" -H "Authorization: Bearer $ATT2_TOKEN" | grep -o '"id":[0-9]*' | head -5 | tail -2 | cut -d':' -f2)

for id in $EVENTS2; do
  echo "Attendee 2 Booking Event ID: $id"
  curl -s -X POST "$BASE_URL/bookings/" \
    -H "Authorization: Bearer $ATT2_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"event_id": '"$id"'}' > /dev/null
done

echo -e "\nDone! Database populated with image URLs."
