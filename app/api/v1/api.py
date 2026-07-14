from fastapi import APIRouter
from app.api.v1.endpoints import auth, owner, super_admin, tenant, analytics, webhooks

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(super_admin.router, prefix="/super-admin", tags=["Super Admin"])
api_router.include_router(owner.router, prefix="/owner", tags=["Owner"])
api_router.include_router(tenant.router, prefix="/tenant", tags=["Tenant"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])