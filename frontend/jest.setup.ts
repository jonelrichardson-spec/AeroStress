// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import fetch from "cross-fetch";

// Make fetch available globally for tests
global.fetch = fetch as any;
