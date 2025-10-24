# Office Management Implementation

## What Was Implemented

I've added the ability for **SUPER_ADMIN** to create and manage multiple offices through the CRM interface.

### Backend Changes

#### 1. New Controller: `apps/api/src/controllers/office.controller.ts`
- ✅ `GET /api/v1/offices` - List all offices (Super Admin sees all, others see only their office)
- ✅ `POST /api/v1/offices` - Create new office (SUPER_ADMIN only)
- ✅ `GET /api/v1/offices/:id` - Get office details
- ✅ `PATCH /api/v1/offices/:id` - Update office (SUPER_ADMIN only)
- ✅ `DELETE /api/v1/offices/:id` - Delete office (SUPER_ADMIN only, with validation)
- ✅ `GET /api/v1/offices/:id/stats` - Get office statistics

#### 2. Updated Routes: `apps/api/src/routes/index.ts`
- Added office management routes
- Protected with `requireSuperAdmin` middleware for create/update/delete operations

### Frontend Changes

#### 1. New Page: `apps/web/src/app/crm/offices/page.tsx`
**Features:**
- View all offices with stats (users, properties, leads, clients, transactions)
- Create new office (modal form)
- Edit existing office (modal form)
- Delete office (with confirmation)
- System-wide statistics at the top
- **Access**: SUPER_ADMIN only

#### 2. Updated Header: `apps/web/src/components/crm/CRMHeader.tsx`
- Added "Zyrat" (Offices) link in navigation
- Only visible to SUPER_ADMIN users

---

## How to Use

### 1. Login as Super Admin
```
Email: admin@wayhome.com
Password: password123
```

### 2. Navigate to Office Management
- Click on "Zyrat" in the CRM header navigation
- Or go directly to: `http://localhost:4000/crm/offices`

### 3. Create a New Office
1. Click "Zyrë e Re" (New Office) button
2. Fill in the form:
   - Office Name (required) - e.g., "Wayhome Vlorë"
   - City (required) - e.g., "Vlorë"
   - Address (required) - e.g., "Rruga Pavarësia, Nr. 123"
   - Phone (optional) - e.g., "+355 33 123456"
   - Email (required) - e.g., "vlore@wayhome.com"
3. Click "Create Office"

### 4. Create Office Admin for the New Office
1. Go to "Agjentët" (Agents) page
2. Click "Agjent i Ri" (New Agent)
3. Fill in the form:
   - Select Role: **OFFICE_ADMIN**
   - Select Office: Your newly created office
   - Fill in email, name, phone, password
4. Click "Krijo Agjentin"

### 5. Test Office Isolation
1. Logout as Super Admin
2. Login as the new Office Admin you created
3. Verify they can ONLY see data from their office

---

## API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/offices` | All authenticated | List offices (filtered by role) |
| POST | `/api/v1/offices` | SUPER_ADMIN | Create new office |
| GET | `/api/v1/offices/:id` | Authenticated | Get office details |
| PATCH | `/api/v1/offices/:id` | SUPER_ADMIN | Update office |
| DELETE | `/api/v1/offices/:id` | SUPER_ADMIN | Delete office (if empty) |
| GET | `/api/v1/offices/:id/stats` | Authenticated | Get office statistics |

---

## Example: Create Office via API

```bash
curl -X POST http://localhost:4001/api/v1/offices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -d '{
    "name": "Wayhome Vlorë",
    "city": "Vlorë",
    "address": "Rruga Pavarësia, Nr. 123, Vlorë",
    "phone": "+355 33 123456",
    "email": "vlore@wayhome.com"
  }'
```

---

## Example: Create Office Admin via API

```bash
curl -X POST http://localhost:4001/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  -d '{
    "email": "admin.vlore@wayhome.com",
    "password": "SecurePassword123!",
    "firstName": "Gentian",
    "lastName": "Hoxha",
    "phone": "+355 69 123456",
    "role": "OFFICE_ADMIN",
    "officeId": "<OFFICE_ID_FROM_PREVIOUS_STEP>"
  }'
```

---

## Office Isolation Behavior

### SUPER_ADMIN
- ✅ Can see ALL offices and ALL data
- ✅ Can create/edit/delete offices
- ✅ Can create users for any office
- ✅ No office filter applied to queries

### OFFICE_ADMIN
- ✅ Can ONLY see their office and its data
- ❌ Cannot see other offices
- ✅ Can create/manage users in their office
- ✅ Can manage properties, leads, clients, transactions in their office
- 🔒 Office filter automatically applied to all queries

### MANAGER
- ✅ Can ONLY see their office data
- ✅ Can manage their team
- 🔒 Office filter automatically applied

### AGENT
- ✅ Can ONLY see their own data within their office
- 🔒 Office + Agent filter applied

---

## Delete Office Protection

An office can only be deleted if:
- ✅ It has NO users
- ✅ It has NO properties

Otherwise, you'll get an error: `"Cannot delete office with X users/properties"`

**To delete an office:**
1. Reassign or delete all users
2. Reassign or delete all properties
3. Then delete the office

---

## Testing Checklist

- [ ] Login as SUPER_ADMIN
- [ ] Navigate to `/crm/offices`
- [ ] Create a new office
- [ ] View office stats
- [ ] Edit the office details
- [ ] Create an OFFICE_ADMIN for the new office
- [ ] Logout and login as the new OFFICE_ADMIN
- [ ] Verify they can ONLY see data from their office
- [ ] Login back as SUPER_ADMIN
- [ ] Verify you can see data from ALL offices

---

## Files Modified/Created

### Backend
- ✅ **NEW**: `apps/api/src/controllers/office.controller.ts` (420 lines)
- ✅ **MODIFIED**: `apps/api/src/routes/index.ts` (added office routes)

### Frontend
- ✅ **NEW**: `apps/web/src/app/crm/offices/page.tsx` (690 lines)
- ✅ **MODIFIED**: `apps/web/src/components/crm/CRMHeader.tsx` (added Offices link)

---

## Summary

✅ **SUPER_ADMIN** can now create multiple offices through the UI  
✅ **SUPER_ADMIN** can manage (edit/delete) offices  
✅ **SUPER_ADMIN** can create OFFICE_ADMIN users for each office  
✅ **OFFICE_ADMIN** sees ONLY their office data (isolation enforced)  
✅ All existing office filtering logic remains intact  
✅ No breaking changes to existing functionality  

**Your multi-office CRM system is now fully functional and manageable through the UI!**

