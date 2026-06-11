from app.services.dashboard_service import dashboard_stats
import traceback
try:
    print(dashboard_stats())
except Exception as e:
    traceback.print_exc()
