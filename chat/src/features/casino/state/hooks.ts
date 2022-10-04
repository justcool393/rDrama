import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from './store';

export const useCasinoDispatch: () => AppDispatch = useDispatch

export const useCasinoSelector: TypedUseSelectorHook<RootState> = useSelector