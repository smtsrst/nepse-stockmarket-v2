"""
NEPSE Stock Dashboard V2 - Main Entry Point
"""

import streamlit as st

# Page configuration
st.set_page_config(
    page_title="NEPSE Stock Dashboard V2",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS
st.markdown(
    """
<style>
    .main-header {
        font-size: 2rem;
        font-weight: bold;
        color: #1f77b4;
    }
    .metric-card {
        background-color: #f0f2f6;
        border-radius: 10px;
        padding: 15px;
        text-align: center;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 24px;
    }
</style>
""",
    unsafe_allow_html=True,
)


def main():
    # Header
    st.markdown(
        '<p class="main-header">📈 NEPSE Stock Dashboard V2</p>', unsafe_allow_html=True
    )

    # Market status
    try:
        from core.data.nepse_client import NepseClient

        client = NepseClient()
        status = client.get_market_status()

        if status.get("isOpen", False):
            st.success("🟢 Market Open (11 AM - 3 PM)")
        else:
            st.info("🔴 Market Closed")
    except Exception as e:
        st.warning(f"Could not connect to NEPSE API: {e}")

    # Tabs
    tab1, tab2, tab3, tab4 = st.tabs(
        ["📊 Dashboard", "🔍 Analysis", "💼 Portfolio", "⚙️ Settings"]
    )

    # Tab 1: Dashboard
    with tab1:
        st.subheader("Market Overview")

        col1, col2, col3, col4 = st.columns(4)

        try:
            from core.data.nepse_client import NepseClient

            client = NepseClient()

            # Market summary
            summary = client.get_market_summary()
            with col1:
                st.metric(
                    "Total Turnover", f"NPR {summary.get('totalTurnover', 0):,.0f}"
                )
            with col2:
                st.metric("Total Trades", f"{summary.get('totalTrade', 0):,}")
            with col3:
                st.metric("Total Volume", f"{summary.get('totalShare', 0):,}")
            with col4:
                st.metric("Companies", f"{summary.get('totalCompanies', 0)}")

            # NEPSE Index
            st.subheader("NEPSE Index")
            index_data = client.get_nepse_index()
            col1, col2 = st.columns(2)
            with col1:
                st.write(f"**NEPSE Index:** {index_data.get('indexValue', 'N/A')}")
                st.write(f"**Change:** {index_data.get('indexChange', 'N/A')}")
            with col2:
                st.write(
                    f"**Sensitive Index:** {index_data.get('sensitiveIndexValue', 'N/A')}"
                )
                st.write(f"**Float Index:** {index_data.get('floatIndexValue', 'N/A')}")

            # Live prices
            st.subheader("Live Stock Prices")
            stocks = client.get_stocks()

            if stocks:
                import pandas as pd

                df = pd.DataFrame(stocks)

                # Display table
                st.dataframe(
                    df[["symbol", "lastTradedPrice", "percentageChange", "volume"]],
                    use_container_width=True,
                )
            else:
                st.info("No stock data available")

        except Exception as e:
            st.error(f"Error loading data: {e}")
            st.info("Make sure nepse-data-api is installed: pip install nepse-data-api")

    # Tab 2: Analysis
    with tab2:
        st.subheader("Stock Analysis")
        st.info("Analysis features coming soon...")

    # Tab 3: Portfolio
    with tab3:
        st.subheader("Portfolio Tracking")
        st.info("Portfolio features coming soon...")

    # Tab 4: Settings
    with tab4:
        st.subheader("Settings")

        st.write("**API Status**")
        try:
            from core.data.nepse_client import NepseClient

            client = NepseClient()
            st.success("✅ Connected to NEPSE API")
        except:
            st.error("❌ Could not connect to NEPSE API")

        st.write("**Data Refresh**")
        refresh_interval = st.slider("Refresh interval (seconds)", 30, 300, 60)

        st.write("**Trading Hours**")
        st.write("11:00 AM - 3:00 PM Nepal Time")


if __name__ == "__main__":
    main()
