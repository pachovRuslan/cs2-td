import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./index";

/**
 * Typed hooks для Redux.
 * Используй их вместо обычных useDispatch/useSelector.
 *
 * Пример:
 *   const money = useAppSelector(s => s.game.money);
 *   const dispatch = useAppDispatch();
 *   dispatch(setMoney(1000));
 */

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;