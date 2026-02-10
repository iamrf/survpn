import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
    isSubscriptionDrawerOpen: boolean;
    isPlanDrawerOpen: boolean;
    selectedPlanType: 'personal' | 'business' | null;
    purchasingPlanId: string | null;
}

const initialState: UIState = {
    isSubscriptionDrawerOpen: false,
    isPlanDrawerOpen: false,
    selectedPlanType: null,
    purchasingPlanId: null,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setSubscriptionDrawerOpen: (state, action: PayloadAction<boolean>) => {
            state.isSubscriptionDrawerOpen = action.payload;
        },
        setPlanDrawerOpen: (state, action: PayloadAction<boolean>) => {
            state.isPlanDrawerOpen = action.payload;
        },
        setSelectedPlanType: (state, action: PayloadAction<'personal' | 'business' | null>) => {
            state.selectedPlanType = action.payload;
        },
        setPurchasingPlanId: (state, action: PayloadAction<string | null>) => {
            state.purchasingPlanId = action.payload;
        },
    },
});

export const { setSubscriptionDrawerOpen, setPlanDrawerOpen, setSelectedPlanType, setPurchasingPlanId } = uiSlice.actions;
export default uiSlice.reducer;
